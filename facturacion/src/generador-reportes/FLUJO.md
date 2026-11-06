# AUDITOR-IA

Accesible en **Facturación → AUDITOR-IA** (`/sln/generador-reportes`). Consulta pacientes e ingresos y descarga los documentos del proceso seleccionado mediante el proyecto hermano de automatización. El ingreso se valida contra el paciente y el proceso antes de encolar, reanudar y comenzar su turno.

| Proceso                                     | Ingresos                                  | Documentos requeridos                                     |
| ------------------------------------------- | ----------------------------------------- | --------------------------------------------------------- |
| Auditoría pre-envío                         | Todos consultables; facturados bloqueados | HC, notas de enfermería, prefactura y soportes requeridos |
| Auditoría concurrente                       | Solo activos                              | HC                                                        |
| Auditoría de cuentas médicas (conciliación) | Solo facturados                           | HC, notas de enfermería, soportes requeridos y factura    |

Pre-envío obtiene primero la prefactura, después HC, enfermería y finalmente soportes. Si no existe prefactura, no continúa con las etapas clínicas. Conciliación obtiene HC, enfermería y soportes; la factura continúa pendiente de implementación y el paquete permanece incompleto. Concurrente no descarga enfermería, prefactura ni soportes.

## Generación local

<<<<<<< HEAD
`POST /v1/generador-reportes/ejecuciones` recibe `{ "documento": "001234", "ingreso": "20", "proceso": "pre-envio" }` y devuelve HTTP 201 con la ejecución en estado `queued` y su posición global. `GET /v1/generador-reportes/ejecuciones/:id` entrega estado y archivos; `GET /v1/generador-reportes/ejecuciones/:id/archivos/:archivo` entrega el PDF autenticado. Requieren el permiso existente de AUDITOR-IA. Cada ejecución pertenece a su usuario, origen de usuario, contexto, paciente, ingreso y proceso; ni otro usuario autorizado ni un administrador diferente pueden acceder a sus archivos mediante estos endpoints.
=======
`POST /v1/generador-reportes/ejecuciones` recibe `{ "documento": "001234", "ingreso": "20", "proceso": "pre-envio" }` y devuelve HTTP 201 con la ejecución en estado `queued` y su posición global. `GET /v1/generador-reportes/ejecuciones/:id` entrega estado y archivos; `GET /v1/generador-reportes/ejecuciones/:id/archivos/:archivo` entrega el PDF autenticado. Requieren el permiso existente de Generador de reportes. Cada ejecución conserva su propietario, origen de usuario, contexto, paciente, ingreso y proceso. La biblioteca comparte los reportes vigentes de todos los usuarios del mismo contexto, incluidos usuarios de distinto origen: pueden consultar su detalle y descargar sus PDF cuando la ejecución terminó y conserva al menos un PDF válido. Una ejecución ajena en cola o en curso, sin PDF válidos o de otra sede devuelve 404. Reanudar y cancelar siguen siendo acciones exclusivas de su propietario.
>>>>>>> sln

El backend localiza la carpeta hermana `Automatización` o usa `EKLIPSE_AUTOMATION_DIR`. Ejecuta Node 24 con `src/worker.ts`, su `.env` y argumentos validados mediante `spawn` sin shell. `EKLIPSE_AUTOMATION_NODE` permite elegir otro ejecutable de Node. El contexto habilitado predeterminado es `ALTACENTRO`; `EKLIPSE_AUTOMATION_CONTEXT` debe coincidir con la sede configurada de DG Web.

`EKLIPSE_AUTOMATION_DATA_DIR` separa los datos de la instalación. En producción se configura como `D:/AUDITOR-IA`: las solicitudes, PDF, manifiestos, errores, cola y bloqueos quedan en `D:/AUDITOR-IA/artifacts/eklipse-jobs/<UUID>/`, conservando `reportes/<cédula>/<ingreso>/` dentro de cada solicitud. La cola y `runner.lock` pertenecen a la carpeta `eklipse-jobs`. El backend pasa esa raíz resuelta al ejecutor para que también sitúe allí sus datos y perfiles de navegador; no propaga las otras variables privadas de Facturación. El código, dependencias, `.env` del ejecutor y `cwd` siguen en `EKLIPSE_AUTOMATION_DIR`. Si se omite la variable, se conserva la ubicación anterior junto al código.

La raíz configurada debe ser absoluta y accesible con permisos de lectura y escritura para la cuenta de PM2. Una ruta incorrecta o un disco sin acceso impiden iniciar la generación; no se guardan los documentos en otro disco como alternativa. Para cambiarla, detener el servicio cuando no haya un worker activo, copiar `artifacts`, `descargas` y los perfiles `.browser-profile*` al nuevo directorio si se desea conservar sus datos, configurar la misma raíz para el backend y los comandos manuales y reiniciar Facturación con el entorno actualizado. No se mueven archivos automáticamente ni se necesita migrar la base de datos. Mantener una sola instancia de Facturación apuntando al mismo almacenamiento.

Las solicitudes se guardan en una cola FIFO y se ejecutan una a la vez. Las peticiones duplicadas para el mismo propietario, paciente, ingreso y proceso recuperan la solicitud activa existente. La cola conserva sus puestos globales sin exponer los datos de otros usuarios y continúa al finalizar o fallar un trabajo. El proceso mantiene estado y PDF verificados por ejecución, conserva resultados parciales y cierra el navegador al terminar. La guía completa está en `Automatización/deploy/eklipse-local.md`.

Cerrar la página, cambiar de módulo o cerrar la sesión no cancela las solicitudes: la cola pertenece al servidor y se reconstruye desde los archivos de cada ejecución al reiniciar el backend. Al volver a entrar, `GET /v1/generador-reportes/cola` recupera el seguimiento del propietario.

`POST /v1/generador-reportes/ejecuciones/:id/cancelar` devuelve HTTP 200 con `estado: cancelled`. Permite cancelar una solicitud propia y vigente, tanto pendiente como en ejecución, con la misma sesión y permiso `004006001`. Retira un pendiente de la FIFO y recalcula los puestos. Si ya está en ejecución, solicita el cierre cooperativo del navegador y espera a que termine el ejecutor antes de liberar el turno; el cierre forzado solo alcanza un proceso propio identificado. Los PDF descargados se conservan, se pueden consultar y descargar, y la solicitud cancelada no se reanuda automáticamente ni ofrece reanudación. Una nueva generación crea otra solicitud. Repetir la cancelación devuelve el mismo resultado; una solicitud ya terminada o fallida devuelve 409 y una ajena o reemplazada devuelve 404.

La cancelación se registra primero como `job.json.cancelledAt` y después en `cancel.json` con `{ requestedAt }`, que el worker observa incluso si el cliente ya salió de la página. Esa marca prevalece sobre un estado antiguo o perdido y se restaura al iniciar el backend, evitando que una solicitud cancelada vuelva a la cola. El estado final se guarda después de la salida del proceso para conservar cualquier PDF que haya terminado durante el cierre. Si el ejecutor no puede cerrarse dentro del plazo de la petición, la API devuelve 409 indicando que la cancelación quedó solicitada; el turno permanece reservado hasta comprobar su salida. No se termina un PID adoptado después de reiniciar sin verificar que corresponde al worker y a su carpeta. `resumen.cancelados` diferencia las cancelaciones dentro de las solicitudes procesadas. Cancelar no borra el paquete previo; un reemplazo posterior con documentos válidos conserva la regla de una sola solicitud visible y puede retirar los archivos anteriores.

La consulta conserva `tipoIngreso` como la forma de ingreso (`AINURGCON`, por ejemplo Remitido) y devuelve además `areaTrabajo` para la navegación en Admisiones. La clase hospitalaria (`AINTIPING = 2`) utiliza Hospitalización; Consulta Externa utiliza Consulta externa y las otras formas utilizan Urgencias, conservando Hospitalización cuando ya viene como forma explícita. Así, un ingreso remitido hospitalario se busca en Hospitalización. El backend prioriza `areaTrabajo` al crear la solicitud y vuelve a consultarla al comenzar cada turno, incluida la reanudación. Por compatibilidad con el ejecutor actual, guarda el área resuelta en `job.json.tipoIngreso` y la pasa mediante `--tipo-ingreso`. Las consultas anteriores sin `areaTrabajo` conservan la resolución a partir de `tipoIngreso`. El cliente no puede elegir estos valores. El área de consulta del ingreso es independiente del área de acceso de la sesión de DG Web.

### Evidencia de soportes y reanudación

El worker publica `completedStages` y `supportManifest: { relativePath, sha256 }` en `execution.json`. El manifiesto está dentro de la ejecución y debe corresponder al ingreso, tener estado `complete`, una lista no vacía de requerimientos y cantidades coherentes con sus adjuntos. El backend comprueba su ruta y checksum.

Si hay adjuntos, se exige además un PDF `soportes-requeridos` unificado, cuyo tamaño, SHA-256, páginas y ruta coincidan con `manifest.unified`. La vista de archivos y el ZIP ofrecen ese PDF; los individuales se conservan como respaldo. Si todos los requerimientos tienen cantidad cero, deben estar `skipped`, sin archivos ni unificado: esa evidencia permite completar la etapa sin inventar un PDF vacío.

Solo esa confirmación verificada publica `sinSoportesRequeridos: true` y añade «Sin reportes requeridos» al mensaje conservando el texto anterior. No se infiere del número de PDF ni de un mensaje o indicador enviado por el worker. El manifiesto debe estar completo, sin errores globales ni de requerimientos; la etapa debe estar finalizada y corresponder al proceso y al ingreso. Una extracción terminada se presenta al 100% y no ofrece reanudar por esa etapa. Los requisitos de HC, enfermería y prefactura, la factura pendiente de conciliación y las fallas de otras etapas conservan sus propios estados.

Sin etapa finalizada o evidencia válida, `soportes-requeridos` permanece en `documentosPendientes`. La ejecución vigente con proceso que ya terminó puede reanudarse para obtener esta nueva etapa, conservando sus documentos clínicos. Una factura pendiente por sí sola no habilita reanudación. Las ejecuciones sin proceso quedan ocultas y no se reclasifican.

## API

`GET /v1/generador-reportes?documento=1065819503&proceso=pre-envio`, con el token de sesión habitual. Los procesos permitidos son `pre-envio`, `concurrente` y `conciliacion`. La conexión clínica se obtiene según la sede del token.

`GET /v1/generador-reportes/cola` muestra el lote del propietario y su progreso, con una sola solicitud vigente por paciente, ingreso y proceso. `GET /v1/generador-reportes/generados?pagina=1` entrega los reportes vigentes con PDF verificados de todos los usuarios del contexto, de diez en diez; admite filtros separados `documento`, `ingreso`, `proceso` y `archivo`, y conserva `busqueda` por compatibilidad. Los criterios se combinan con AND y el frontend los envía al pulsar Aplicar filtros. `proceso=anteriores` se acepta por compatibilidad y devuelve una lista vacía. Los contadores de la biblioteca incluyen los reportes compartidos; los de la cola siguen correspondiendo al propietario actual.

Todas las respuestas de ejecución incorporan `claveReporte`, una identidad opaca estable que incluye propietario, origen, contexto, paciente, ingreso y proceso, y `puedeGestionar`. La clave permite que reportes de usuarios diferentes para el mismo ingreso coexistan sin confundirse con versiones reemplazadas. `puedeGestionar` es falso en reportes ajenos, que también publican `reanudable: false`; una llamada directa de reanudación o cancelación ajena continúa devolviendo 404. La biblioteca no modifica la asociación de reportes de la búsqueda clínica ni expone el detalle de la cola de otros usuarios.

`disponibleParaProceso` exige todos los documentos requeridos y la elegibilidad clínica actual. `estado=complete` significa que terminó la extracción y no garantiza que el paquete esté disponible: puede faltar factura, algún documento clínico o la etapa de soportes.

Los avisos `codigo-salario` y `servicios-sin-cubrimiento` conservan el texto visible comunicado por DG Web en Liquidación. El ejecutor lo persiste antes de aceptar **OK**, continúa la generación y los conserva como advertencias informativas, sin añadir fallas técnicas ni alterar los requisitos de disponibilidad. La API entrega el mensaje íntegro en `avisos[].mensaje`, también cuando se recupera desde `prefactura/avisos.json`; se mantienen los controles de ingreso, contexto y acceso a la ejecución. El frontend los cuenta como avisos vigentes y los presenta en amarillo, aunque la extracción ya haya terminado. Los errores técnicos resueltos de intentos anteriores no forman parte de ese contador.

La respuesta incorpora opcionalmente `reportes` en cada ingreso con la solicitud vigente del usuario, origen, contexto, paciente, ingreso y proceso. Contiene el mismo identificador, estado y lista de archivos que el endpoint de ejecución. Una nueva generación reemplaza la solicitud anterior desde que se encola; un fallo o un resultado vacío nuevo nunca vuelve a mostrar el paquete previo. Los filtros se aplican después de elegir la solicitud vigente, por lo que tampoco recuperan versiones anteriores. Solo se ofrecen archivos existentes dentro de la carpeta de su ejecución, conservando sus identificadores originales. La consulta no inicia Playwright.

Los identificadores reemplazados no permiten consultar, descargar PDF o ZIP ni reanudar: devuelven 404. El reemplazo conserva el propietario como parte de la clave: generar de nuevo no reemplaza los reportes de otro usuario. Cuando la nueva solicitud termina con PDF verificados, incluso si el resultado es parcial, se retiran físicamente los archivos del paquete anterior de la misma clave. También se retiran si la nueva extracción termina sin PDF con ausencia de documentos confirmada. La limpieza se ejecuta al cerrar el worker y puede reintentarse al consultar si Windows mantiene un archivo ocupado. Si ocurre una falla técnica sin ningún PDF válido, los archivos previos quedan temporalmente ocultos e inaccesibles y se retiran al siguiente reemplazo válido. Pueden conservarse los metadatos de las solicitudes; no se realiza una purga masiva de ejecuciones sin proceso.

El ojo de cada ingreso abre un modal con los archivos y las opciones Vista previa y Descargar PDF. El frontend abre la vista previa mediante el mismo endpoint de archivos autenticado: recibe un Blob, comprueba la cabecera PDF y crea una URL local para el visor. La URL se libera al cerrar el visor o modal, cambiar de archivo o paciente, o abandonar la página. No se publican enlaces estáticos ni tokens en la URL.

El modal muestra paciente y cédula cuando corresponden al documento consultado, cantidad de PDF, fecha de inicio de la generación y tamaño de cada archivo. El visor se puede plegar y abrir en otra pestaña mediante la URL local del PDF. Descargar todos solicita los PDF disponibles uno por uno a través de sus endpoints individuales autenticados y los guarda por separado con sus nombres originales, mostrando el avance de la secuencia. Si falla uno, continúa con los demás e informa el faltante; cerrar el modal cancela la petición activa y las pendientes. El endpoint `GET /v1/generador-reportes/ejecuciones/:id/archivos` mantiene el ZIP por compatibilidad, con los mismos controles de contexto, vigencia y archivos válidos que la descarga individual.

La cédula admite de 1 a 20 dígitos; se eliminan espacios exteriores y se conservan ceros iniciales. Las consultas usan parámetros posicionales de TypeORM para SQL Server.

```json
{
  "paciente": {
    "documento": "1065819503",
    "nombreCompleto": "ANA MARÍA PÉREZ RUIZ",
    "fechaNacimiento": "1995-10-10",
    "sexo": "Femenino"
  },
  "ingresos": [
    { "consecutivo": 123, "fechaIngreso": "2026-10-09T10:30:00.000Z", "estado": "Registrado" }
  ]
}
```

Los ingresos se ordenan por `AINFECING DESC`. Se conservan Registrado, Facturado, Anulado, Bloqueado y Cerrado; otros códigos se muestran como Desconocido. La interfaz muestra la fecha y hora sin desplazar la hora almacenada por SQL Server (serialización UTC del controlador SQL).

`GPAFECNAC` se entrega como fecha de calendario `AAAA-MM-DD` o `null`; la interfaz calcula la edad cumplida y muestra No registrada si falta o es inválida. `GPASEXPAC` se traduce a Ninguno, Masculino, Femenino o Indefinido para los códigos 0–3, y No registrado si falta o es desconocido. La tarjeta muestra cédula, edad, sexo y total de ingresos. El selector permite ordenar en ambos sentidos sin repetir la consulta.

Si el paciente no existe, la respuesta es `{ "paciente": null, "ingresos": [] }`. Si existe sin ingresos, se conserva su identificación y `ingresos` queda vacío. Una identificación duplicada devuelve HTTP 409, una cédula inválida HTTP 400 y un fallo de consulta HTTP 503 con un mensaje público sin detalles SQL.

## Registro del permiso antes de habilitar usuarios

El código fuente incorpora el submódulo `004006` y el permiso `004006001`. Las constantes no crean registros en la base de seguridad.

Para registrar ambos en una sede, ejecutar completo [`database/20261029_crear_permiso_generador_reportes.sql`](database/20261029_crear_permiso_generador_reportes.sql) en su base de datos. El script se puede repetir, valida los códigos ocupados y conserva la activación de registros existentes. Los nuevos se crean activos; al terminar muestra los estados de módulo, submódulo y permiso. La asignación a usuarios o roles se realiza por separado desde Seguridad.

Si ya se crearon con los nombres anteriores, ejecutar [`database/20261029_renombrar_auditor_ia.sql`](database/20261029_renombrar_auditor_ia.sql) en esa misma base. Solo cambia el nombre del submódulo y del permiso a **AUDITOR-IA**; conserva los identificadores, códigos, activación y asignaciones. El script de creación admite ambos nombres para poder repetirse antes o después del cambio.

1. En Seguridad, localizar el módulo Facturación, código local `004`.
2. Registrar el submódulo **AUDITOR-IA** con código local `006` en `EKGENSUBMODULO`, asociado a Facturación; el código completo es `004006`.
3. Registrar el permiso **AUDITOR-IA** con código local `001` en `GCMMODULOS`, asociado al módulo y submódulo; el código completo es `004006001`.
4. Comprobar los códigos que devuelve el administrador existente: la creación asigna códigos consecutivos automáticamente. Si `006` ya está ocupado por otro submódulo, resolver el conflicto de catálogo antes de habilitar esta versión, sin reasignar permisos existentes.
5. Activar módulo, submódulo y permiso en las sedes correspondientes; asignar el permiso a los roles o usuarios autorizados y renovar su sesión.
6. Verificar menú, acceso directo y API con un usuario autorizado y uno sin permiso. Los administradores conservan el acceso habitual.

La implementación no ejecuta escrituras sobre el catálogo de seguridad. El permiso del submódulo o de Facturación por sí solo no concede acceso al endpoint: se exige `004006001` o el permiso administrador habitual (`001001001` en backend, `admin` en la sesión del frontend).

## Verificación con datos simulados

Desde la raíz del backend, compilar con `npm --prefix facturacion run build`. Desde la carpeta `facturacion`, ejecutar `../node_modules/.bin/jest --config jest.generador-reportes.config.cjs --runInBand` (en Windows usar `..\node_modules\.bin\jest.cmd`). La configuración específica resuelve los alias de Facturación sin modificar la configuración de pruebas de otros módulos.

Desde la raíz del frontend, ejecutar `ng build shell --configuration development`, `ng build sln --configuration development` y `ng test sln --include '**/generador-reportes/**/*.spec.ts' --watch=false --browsers=ChromeHeadless`. Usar el ejecutable de Angular en `node_modules/.bin` y definir `CHROME_BIN` si Chrome no está disponible en la ubicación habitual.

Las pruebas usan SQL, permisos y respuestas HTTP simulados. Cubren búsqueda explícita, validación, cancelación de la consulta al editar o salir, reintento, datos inexistentes, duplicados y control de acceso. La cola se prueba con ejecutores sintéticos, incluidos la cancelación pendiente y activa, sus puestos, recuperación tras reinicio, conservación de PDF, idempotencia y protección de procesos ajenos. La validación sobre datos clínicos reales se realiza después de desplegar y asignar el permiso en la sede correspondiente.

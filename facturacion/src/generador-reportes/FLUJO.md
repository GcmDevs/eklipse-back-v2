# AUDITOR-IA

Accesible en **Facturación → AUDITOR-IA** (`/sln/generador-reportes`). Consulta pacientes e ingresos y descarga los documentos del proceso seleccionado mediante el proyecto hermano de automatización. El ingreso se valida contra el paciente y el proceso antes de encolar, reanudar y comenzar su turno.

| Proceso                                     | Ingresos                                  | Documentos requeridos                                     |
| ------------------------------------------- | ----------------------------------------- | --------------------------------------------------------- |
| Auditoría pre-envío                         | Todos consultables; facturados bloqueados | HC, notas de enfermería, prefactura y soportes requeridos |
| Auditoría concurrente                       | Solo activos                              | HC                                                        |
| Auditoría de cuentas médicas (conciliación) | Solo facturados                           | HC, notas de enfermería, soportes requeridos y factura    |

Pre-envío obtiene primero la prefactura, después HC, enfermería y finalmente soportes. Si no existe prefactura, no continúa con las etapas clínicas. Conciliación obtiene HC, enfermería y soportes; la factura continúa pendiente de implementación y el paquete permanece incompleto. Concurrente no descarga enfermería, prefactura ni soportes.

## Generación local

`POST /v1/generador-reportes/ejecuciones` recibe `{ "documento": "001234", "ingreso": "20", "proceso": "pre-envio" }` y devuelve HTTP 201 con la ejecución en estado `queued` y su posición global. `GET /v1/generador-reportes/ejecuciones/:id` entrega estado y archivos; `GET /v1/generador-reportes/ejecuciones/:id/archivos/:archivo` entrega el PDF autenticado. Requieren el permiso existente de AUDITOR-IA. Cada ejecución pertenece a su usuario, origen de usuario, contexto, paciente, ingreso y proceso; ni otro usuario autorizado ni un administrador diferente pueden acceder a sus archivos mediante estos endpoints.

El backend localiza la carpeta hermana `Automatización` o usa `EKLIPSE_AUTOMATION_DIR`. Ejecuta Node 24 con `src/worker.ts`, su `.env` y argumentos validados mediante `spawn` sin shell. `EKLIPSE_AUTOMATION_NODE` permite elegir otro ejecutable de Node. El contexto habilitado predeterminado es `ALTACENTRO`; `EKLIPSE_AUTOMATION_CONTEXT` debe coincidir con la sede configurada de DG Web.

Las solicitudes se guardan en una cola FIFO y se ejecutan una a la vez. Las peticiones duplicadas para el mismo propietario, paciente, ingreso y proceso recuperan la solicitud activa existente. La cola conserva sus puestos globales sin exponer los datos de otros usuarios y continúa al finalizar o fallar un trabajo. El proceso mantiene estado y PDF verificados por ejecución, conserva resultados parciales y cierra el navegador al terminar. La guía completa está en `Automatización/deploy/eklipse-local.md`.

El `tipoIngreso` se toma de la consulta clínica, se guarda en `job.json` y se actualiza al llegar el turno. Se pasa al ejecutor mediante `--tipo-ingreso`; si el dato no existe se usa `Desconocido`. El cliente no puede elegir este valor. La automatización selecciona el área que coincide con Urgencias, Consulta externa u Hospitalización; los demás tipos utilizan Urgencias. Este dato es independiente del área de acceso de la sesión de DG Web.

### Evidencia de soportes y reanudación

El worker publica `completedStages` y `supportManifest: { relativePath, sha256 }` en `execution.json`. El manifiesto está dentro de la ejecución y debe corresponder al ingreso, tener estado `complete`, una lista no vacía de requerimientos y cantidades coherentes con sus adjuntos. El backend comprueba su ruta y checksum.

Si hay adjuntos, se exige además un PDF `soportes-requeridos` unificado, cuyo tamaño, SHA-256, páginas y ruta coincidan con `manifest.unified`. La vista de archivos y el ZIP ofrecen ese PDF; los individuales se conservan como respaldo. Si todos los requerimientos tienen cantidad cero, deben estar `skipped`, sin archivos ni unificado: esa evidencia permite completar la etapa sin inventar un PDF vacío.

Solo esa confirmación verificada publica `sinSoportesRequeridos: true` y añade «Sin reportes requeridos» al mensaje conservando el texto anterior. No se infiere del número de PDF ni de un mensaje o indicador enviado por el worker. El manifiesto debe estar completo, sin errores globales ni de requerimientos; la etapa debe estar finalizada y corresponder al proceso y al ingreso. Una extracción terminada se presenta al 100% y no ofrece reanudar por esa etapa. Los requisitos de HC, enfermería y prefactura, la factura pendiente de conciliación y las fallas de otras etapas conservan sus propios estados.

Sin etapa finalizada o evidencia válida, `soportes-requeridos` permanece en `documentosPendientes`. La ejecución vigente con proceso que ya terminó puede reanudarse para obtener esta nueva etapa, conservando sus documentos clínicos. Una factura pendiente por sí sola no habilita reanudación. Las ejecuciones sin proceso quedan ocultas y no se reclasifican.

## API

`GET /v1/generador-reportes?documento=1065819503&proceso=pre-envio`, con el token de sesión habitual. Los procesos permitidos son `pre-envio`, `concurrente` y `conciliacion`. La conexión clínica se obtiene según la sede del token.

`GET /v1/generador-reportes/cola` muestra el lote del propietario y su progreso, con una sola solicitud vigente por paciente, ingreso y proceso. `GET /v1/generador-reportes/generados?pagina=1` entrega los reportes vigentes con PDF verificados de diez en diez; admite filtros separados `documento`, `ingreso`, `proceso` y `archivo`, y conserva `busqueda` por compatibilidad. Los criterios se combinan con AND. `proceso=anteriores` se acepta por compatibilidad y devuelve una lista vacía. Los contadores solo incluyen las solicitudes vigentes del propietario actual.

`disponibleParaProceso` exige todos los documentos requeridos y la elegibilidad clínica actual. `estado=complete` significa que terminó la extracción y no garantiza que el paquete esté disponible: puede faltar factura, algún documento clínico o la etapa de soportes.

La respuesta incorpora opcionalmente `reportes` en cada ingreso con la solicitud vigente del usuario, origen, contexto, paciente, ingreso y proceso. Contiene el mismo identificador, estado y lista de archivos que el endpoint de ejecución. Una nueva generación reemplaza la solicitud anterior desde que se encola; un fallo o un resultado vacío nuevo nunca vuelve a mostrar el paquete previo. Los filtros se aplican después de elegir la solicitud vigente, por lo que tampoco recuperan versiones anteriores. Solo se ofrecen archivos existentes dentro de la carpeta de su ejecución, conservando sus identificadores originales. La consulta no inicia Playwright.

Los identificadores reemplazados no permiten consultar, descargar PDF o ZIP ni reanudar: devuelven 404. Cuando la nueva solicitud termina con PDF verificados, incluso si el resultado es parcial, se retiran físicamente los archivos del paquete anterior de la misma clave. También se retiran si la nueva extracción termina sin PDF con ausencia de documentos confirmada. La limpieza se ejecuta al cerrar el worker y puede reintentarse al consultar si Windows mantiene un archivo ocupado. Si ocurre una falla técnica sin ningún PDF válido, los archivos previos quedan temporalmente ocultos e inaccesibles y se retiran al siguiente reemplazo válido. Pueden conservarse los metadatos de las solicitudes; no se realiza una purga masiva de ejecuciones sin proceso.

El ojo de cada ingreso abre un modal con los archivos y las opciones Vista previa y Descargar PDF. El frontend abre la vista previa mediante el mismo endpoint de archivos autenticado: recibe un Blob, comprueba la cabecera PDF y crea una URL local para el visor. La URL se libera al cerrar el visor o modal, cambiar de archivo o paciente, o abandonar la página. No se publican enlaces estáticos ni tokens en la URL.

El modal muestra paciente y cédula cuando corresponden al documento consultado, cantidad de PDF, fecha de inicio de la generación y tamaño de cada archivo. El visor se puede plegar y abrir en otra pestaña mediante la URL local del PDF. Descargar todos descarga directamente el PDF si hay uno; si hay varios, usa `GET /v1/generador-reportes/ejecuciones/:id/archivos` y recibe un ZIP por flujo con los PDF existentes, agrupados por tipo. La descarga conjunta mantiene las mismas guardas y comprobaciones de propietario y rutas que la descarga individual.

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

Las pruebas usan SQL, permisos y respuestas HTTP simulados. Cubren búsqueda explícita, validación, cancelación al editar o salir, reintento, datos inexistentes, duplicados y control de acceso. La validación sobre datos clínicos reales se realiza después de desplegar y asignar el permiso en la sede correspondiente.

# Generador de reportes

Accesible en **Facturación → Generador de reportes** (`/sln/generador-reportes`). Consulta pacientes e ingresos y permite descargar sus historias clínicas y enfermería mediante el proyecto hermano de automatización. El ingreso se valida contra el paciente antes de iniciar Playwright.

## Generación local

`POST /v1/generador-reportes/ejecuciones` recibe `{ "documento": "001234", "ingreso": "20" }`, devuelve HTTP 201 con el identificador de ejecución y arranca el ejecutor sin entrada de terminal. `GET /v1/generador-reportes/ejecuciones/:id` entrega estado y archivos; `GET /v1/generador-reportes/ejecuciones/:id/archivos/:archivo` entrega el PDF autenticado. Los tres requieren el permiso existente de Generador de reportes, que ahora cubre consulta, generación y descarga. Cada ejecución pertenece a su usuario, origen de usuario y contexto; ni otro usuario autorizado ni un administrador diferente pueden acceder a sus archivos mediante estos endpoints.

El backend localiza la carpeta hermana `Automatización` o usa `EKLIPSE_AUTOMATION_DIR`. Ejecuta Node 24 con `src/worker.ts`, su `.env` y argumentos validados mediante `spawn` sin shell. `EKLIPSE_AUTOMATION_NODE` permite elegir otro ejecutable de Node. El contexto habilitado predeterminado es `ALTACENTRO`; `EKLIPSE_AUTOMATION_CONTEXT` debe coincidir con la sede configurada de DG Web.

Una generación ocupa el ejecutor y una segunda solicitud recibe HTTP 409. El proceso mantiene estado y PDF verificados por ejecución, conserva resultados parciales y cierra el navegador al terminar. La guía completa está en `Automatización/deploy/eklipse-local.md`. No requiere un servicio ni un puerto adicionales para Playwright.

## API

`GET /v1/generador-reportes?documento=1065819503`, con el token de sesión habitual. La conexión clínica se obtiene de `BaseSource` según la sede del token.

La respuesta incorpora opcionalmente `reportes` en cada ingreso con PDF guardados del usuario y contexto actuales. Contiene el mismo identificador, estado y lista de archivos que el endpoint de ejecución. Se prefiere la ejecución completa más reciente; una posterior incompleta no la reemplaza. Solo se ofrecen archivos existentes dentro de la carpeta de su ejecución, conservando sus identificadores originales. La consulta no inicia Playwright.

El ojo de cada ingreso abre un modal con los archivos y las opciones Vista previa y Descargar PDF. El frontend abre la vista previa mediante el mismo endpoint de archivos autenticado: recibe un Blob, comprueba la cabecera PDF y crea una URL local para el visor. La URL se libera al cerrar el visor o modal, cambiar de archivo o paciente, o abandonar la página. No se publican enlaces estáticos ni tokens en la URL.

El modal muestra paciente y cédula cuando corresponden al documento consultado, cantidad de PDF, fecha de inicio de la generación y tamaño de cada archivo. El visor se puede plegar y abrir en otra pestaña mediante la URL local del PDF. Descargar todos descarga directamente el PDF si hay uno; si hay varios, usa `GET /v1/generador-reportes/ejecuciones/:id/archivos` y recibe un ZIP por flujo con los PDF existentes, agrupados por tipo. La descarga conjunta mantiene las mismas guardas y comprobaciones de propietario y rutas que la descarga individual.

La cédula admite de 1 a 20 dígitos; se eliminan espacios exteriores y se conservan ceros iniciales. Las consultas usan parámetros posicionales de TypeORM para SQL Server.

```json
{
  "paciente": { "documento": "1065819503", "nombreCompleto": "ANA MARÍA PÉREZ RUIZ", "fechaNacimiento": "1995-10-10", "sexo": "Femenino" },
  "ingresos": [{ "consecutivo": 123, "fechaIngreso": "2026-10-09T10:30:00.000Z", "estado": "Registrado" }]
}
```

Los ingresos se ordenan por `AINFECING DESC`. Se conservan Registrado, Facturado, Anulado, Bloqueado y Cerrado; otros códigos se muestran como Desconocido. La interfaz muestra la fecha y hora sin desplazar la hora almacenada por SQL Server (serialización UTC del controlador SQL).

`GPAFECNAC` se entrega como fecha de calendario `AAAA-MM-DD` o `null`; la interfaz calcula la edad cumplida y muestra No registrada si falta o es inválida. `GPASEXPAC` se traduce a Ninguno, Masculino, Femenino o Indefinido para los códigos 0–3, y No registrado si falta o es desconocido. La tarjeta muestra cédula, edad, sexo y total de ingresos. El selector permite ordenar en ambos sentidos sin repetir la consulta.

Si el paciente no existe, la respuesta es `{ "paciente": null, "ingresos": [] }`. Si existe sin ingresos, se conserva su identificación y `ingresos` queda vacío. Una identificación duplicada devuelve HTTP 409, una cédula inválida HTTP 400 y un fallo de consulta HTTP 503 con un mensaje público sin detalles SQL.

## Registro del permiso antes de habilitar usuarios

El código fuente incorpora el submódulo `004006` y el permiso `004006001`. Las constantes no crean registros en la base de seguridad.

1. En Seguridad, localizar el módulo Facturación, código local `004`.
2. Registrar el submódulo **Generador de reportes** con código local `006` en `EKGENSUBMODULO`, asociado a Facturación; el código completo es `004006`.
3. Registrar **Consultar pacientes e ingresos** con código local `001` en `GCMMODULOS`, asociado al módulo y submódulo; el código completo es `004006001`.
4. Comprobar los códigos que devuelve el administrador existente: la creación asigna códigos consecutivos automáticamente. Si `006` ya está ocupado por otro submódulo, resolver el conflicto de catálogo antes de habilitar esta versión, sin reasignar permisos existentes.
5. Activar módulo, submódulo y permiso en las sedes correspondientes; asignar el permiso a los roles o usuarios autorizados y renovar su sesión.
6. Verificar menú, acceso directo y API con un usuario autorizado y uno sin permiso. Los administradores conservan el acceso habitual.

La implementación no ejecuta escrituras sobre el catálogo de seguridad. El permiso del submódulo o de Facturación por sí solo no concede acceso al endpoint: se exige `004006001` o el permiso administrador habitual (`001001001` en backend, `admin` en la sesión del frontend).

## Verificación con datos simulados

Desde la raíz del backend, compilar con `npm --prefix facturacion run build`. Desde la carpeta `facturacion`, ejecutar `../node_modules/.bin/jest --config jest.generador-reportes.config.cjs --runInBand` (en Windows usar `..\node_modules\.bin\jest.cmd`). La configuración específica resuelve los alias de Facturación sin modificar la configuración de pruebas de otros módulos.

Desde la raíz del frontend, ejecutar `ng build shell --configuration development`, `ng build sln --configuration development` y `ng test sln --include '**/generador-reportes/**/*.spec.ts' --watch=false --browsers=ChromeHeadless`. Usar el ejecutable de Angular en `node_modules/.bin` y definir `CHROME_BIN` si Chrome no está disponible en la ubicación habitual.

Las pruebas usan SQL, permisos y respuestas HTTP simulados. Cubren búsqueda explícita, validación, cancelación al editar o salir, reintento, datos inexistentes, duplicados y control de acceso. La validación sobre datos clínicos reales se realiza después de desplegar y asignar el permiso en la sede correspondiente.

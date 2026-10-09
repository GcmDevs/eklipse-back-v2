# Generador de reportes

Primera versión de consulta, accesible en **Facturación → Generador de reportes** (`/sln/generador-reportes`). No crea pacientes, modifica ingresos ni genera archivos.

## API

`GET /v1/generador-reportes?documento=1065819503`, con el token de sesión habitual. La conexión clínica se obtiene de `BaseSource` según la sede del token.

La cédula admite de 1 a 20 dígitos; se eliminan espacios exteriores y se conservan ceros iniciales. Las consultas usan parámetros posicionales de TypeORM para SQL Server.

```json
{
  "paciente": { "documento": "1065819503", "nombreCompleto": "ANA MARÍA PÉREZ RUIZ" },
  "ingresos": [{ "consecutivo": 123, "fechaIngreso": "2026-10-09T10:30:00.000Z", "estado": "Registrado" }]
}
```

Los ingresos se ordenan por `AINFECING DESC`. Se conservan Registrado, Facturado, Anulado, Bloqueado y Cerrado; otros códigos se muestran como Desconocido. La interfaz muestra la fecha y hora sin desplazar la hora almacenada por SQL Server (serialización UTC del controlador SQL).

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

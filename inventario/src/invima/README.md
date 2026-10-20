# Verificación INVIMA

Ruta de Eklipse: /inn/invima. Backend: /v4/inn/invima. Los productos pertenecen a la conexión del contexto del token; no se reciben contextos o usuarios desde el cliente.

## Activación

1. Ejecutar inventario/database/migrations/20261020_invima.sql en cada base de contexto que habilite el módulo (SQL Server 2016 o superior por ISJSON).
2. Asignar el permiso 006005002, «Verificación INVIMA», mediante la administración de permisos existente. La migración registra el permiso sin concederlo; si el código ya pertenece a otra función, aborta. Quien tenga el permiso activo ADMINISTRADOR (001001001), directamente o por su rol, puede usar todos los endpoints sin necesitar 006005002.
3. Configurar, si se requiere, INVIMA_APP_TOKEN en el entorno del proceso del backend.
4. Validar las fuentes con el script de comprobación antes de habilitar el acceso del equipo.
5. Compilar y desplegar inventario y el frontend (shell e inn).

Los datasets se pueden reemplazar mediante INVIMA_DATASET_VIGENTES, INVIMA_DATASET_VENCIDOS, INVIMA_DATASET_RENOVACION e INVIMA_DATASET_OTROS. Los valores por defecto son i7cb-raxc, vwwf-4ftk, vgr4-gemg y spzp-dfuc. El dominio permanece restringido a www.datos.gov.co. Nunca incluir el token en el frontend.

## Comprobación

Desde la raíz del backend:

    node node_modules/jest/bin/jest.js --config inventario/package.json --runInBand --testPathPatterns invima
    node node_modules/typescript/bin/tsc -p inventario/tsconfig.app.json --noEmit --incremental false

Para consultas reales (solo lectura), PowerShell:

    $env:TS_NODE_PROJECT='inventario/tsconfig.json'
    node -r ts-node/register inventario/scripts/verificar-fuentes-invima.ts

El script valida metadatos y búsquedas por CUM, registro sanitario y nombre en las cuatro fuentes. Su salida no incluye el app token.

## API y persistencia

- GET/POST productos: listar o registrar.
- El listado incluye cumVerificado y estadoCum, ambos anulables. Se extraen de la coincidencia confirmada o exacta de la última verificación de la versión actual, sin consultar nuevamente a INVIMA ni descargar el historial. Crear o editar devuelve ambos campos en null.
- PUT productos/:id: editar; exige version actual y deja el producto pendiente.
- POST productos/:id/verificaciones: consultar y guardar una nueva evidencia.
- GET productos/:id/verificaciones: historial de versiones, consultas y confirmaciones.
- GET productos/:id/verificaciones/:verificacionId/candidatos?fuenteId=vigentes&offset=20: siguiente página de 20 candidatos.
- POST productos/:id/verificaciones/:verificacionId/confirmacion con clave: confirmar un candidato ya guardado como evidencia.

Cada consulta conserva datos ingresados, páginas consultadas, errores, versión del producto y fecha de actualización de las fuentes. Las confirmaciones son registros separados; no sobrescriben el resultado original. Una fuente fallida implica resultado INCOMPLETA y bloquea la confirmación hasta repetir la consulta.

El CUM exacto solo se asocia automáticamente con cobertura completa y sin contradicciones. Los registros sanitarios y nombres generan candidatos para revisar. Las filas repetidas por ingredientes o roles se deduplican en la consulta SoQL usando los campos de identidad/presentación. La concentración de las fuentes CUM no se interpreta como una concentración clínica comparable.

Los formatos de fecha de las fuentes se conservan como texto, incluido el año 3000. Las fechas de auditoría se presentan en America/Bogota. Al cambiar una fuente se impide mezclar nuevas páginas con una evidencia previa.

## Operación

Las peticiones externas tienen un límite de 12 segundos y como máximo un reintento ante fallos transitorios. Los metadatos se guardan en memoria durante cinco minutos; las páginas adicionales comprueban la versión de la fuente. La pantalla procesa como máximo dos productos simultáneos y permite reintentar cada producto fallido. Salir detiene el envío de nuevas consultas; las peticiones ya enviadas pueden terminar y quedar en el historial.

No se modifican el catálogo INNPRODUC ni las recepciones técnicas. La migración no se ejecuta automáticamente al iniciar el backend.

## Diagnóstico de conexión

Si se modifica el archivo .env, reiniciar el proceso de Inventario: dotenv se ejecuta al iniciar y las conexiones existentes mantienen el servidor anterior. Ejecutar la migración sobre una base distinta de la conexión activa no habilita el módulo.

Si cambian las conexiones, reiniciar también General (autenticación, puerto 8101) y volver a iniciar sesión. Los dos procesos deben consultar la misma base para autenticar al usuario y resolver sus permisos. El alias admin del frontend en desarrollo no concede permisos en el backend.

La ausencia de cualquiera de las tres tablas devuelve HTTP 503 con código INVIMA_MIGRACION_PENDIENTE y un mensaje de configuración. No se interpreta como una lista vacía ni se crean tablas automáticamente. Otros errores SQL conservan el tratamiento habitual del backend.

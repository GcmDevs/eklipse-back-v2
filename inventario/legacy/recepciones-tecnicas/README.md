# Inspección de recepción técnica

La pantalla existente de Farmacia usa `GET`, `POST` y `PUT /v1/fmc/rec-tec`. Las conexiones y el usuario proceden del contexto autenticado. Esta mejora no consulta INVIMA, no cambia inventario ni los documentos originales y no genera un informe nuevo.

## Activación

Antes de desplegar Inventario, ejecutar `inventario/database/migrations/20261030_recepcion_tecnica_inspeccion.sql` en cada base de contexto. Es repetible, añade `GCMRECTECPROD.INSPECCIONJSON` anulable con comprobación ISJSON, permite temperatura/registro no aplicables conservando sus tipos y habilita cuatro decimales en los lotes propios de inspección. Aborta y revierte si hay cantidades históricas incompatibles. No se ejecuta automáticamente ni recalcula registros anteriores. Requiere SQL Server 2016 o superior. Conservar las migraciones INVIMA existentes: esta migración corresponde a recepción técnica.

## Contrato por producto

`inspeccion` es opcional para clientes anteriores. En clientes nuevos incluye `cantidadFacturada`, `novedades: [{tipo,cantidad}]`, `motivosRechazo`, `ium` y `numeroResolucion`. Las categorías son AVERIA, FALTANTE, SOBRANTE y NO_SOLICITADO; los motivos son CUM e INVIMA. El servidor recalcula cantidad física desde `lotes`, diferencias, muestreo y cumplimiento. La respuesta añade versión de esquema 1, cantidad física y auditoría de usuario/fecha UTC. Omitir el objeto o los lotes desde un cliente anterior conserva los valores guardados; los campos internos y la auditoría recibidos del cliente no se usan.

Las cantidades admiten cuatro decimales; la facturada puede ser cero y cada lote debe ser positivo. No se suman avería y no solicitado para deducir aceptación: pueden referirse a las mismas unidades. Las diferencias no cambian el resultado sanitario. Un rechazo CUM/INVIMA afecta todo el renglón. Sin lotes se guarda cero físico, muestreo N/A y muestra cero, sin temperatura ni verificaciones físicas inventadas. La pantalla lo identifica como «Sin unidades para inspeccionar».

El tipo 4, Vital no disponible, exige IUM o resolución como texto, conserva ceros iniciales y admite ambos. El registro INVIMA se guarda como null y sus verificaciones quedan no aplicables; el resultado depende de etiqueta, sellos, embalaje y muestreo. No admite rechazo CUM/INVIMA. Medicamento y Reactivo comparten campos; Dispositivo omite concentración, unidad y forma farmacéutica y conserva serie/vida útil.

Cada escritura valida que recepción, renglón, producto y lotes pertenezcan al documento del contexto. Se rechazan modificaciones de inspecciones heredadas y recepciones cerradas. Se conservan las restricciones existentes del PUT (propietario y tres horas) y el cierre de siete días del flujo POST. Las inspecciones antiguas sin JSON se muestran con su resultado original.

## Verificación

Desde la raíz del backend:

    node node_modules/jest/bin/jest.js --config inventario/package.json --runInBand --testPathPatterns recepcion-tecnica

Las pruebas usan datos sintéticos y repositorios simulados. No requieren claves RSA, conexiones ni escritura a bases de producción. La prueba de navegador del frontend usa la API simulada para comprobar formulario, tipos, novedades, guardado y recarga en escritorio y móvil.

Comprobación de la migración en SQL Server con la conexión AC configurada:

    node inventario/scripts/verificar-migracion-recepcion-tecnica.cjs

Crea únicamente esquemas sintéticos de nombres aleatorios dentro de transacciones revertidas y verifica que no queden residuos. No aplica la migración a las tablas reales. Valida repetición, conservación de tipos y valores, campos no aplicables, fracciones y rechazo de JSON o cantidades incompatibles.

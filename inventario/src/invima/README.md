# Verificación INVIMA

Ruta de Eklipse: /inn/invima. Backend: /v4/inn/invima. Los productos pertenecen a la conexión del contexto del token; no se reciben contextos o usuarios desde el cliente.

## Activación

1. Ejecutar, en orden, inventario/database/migrations/20261020_invima.sql, 20261020_invima_facturas.sql, 20261021_invima_facturas_soft_delete.sql y 20261022_invima_observaciones.sql en cada base de contexto que habilite el módulo (SQL Server 2016 o superior por ISJSON). Aplicar la última antes de desplegar el backend que la utiliza. Las migraciones no se ejecutan al iniciar el servidor.
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

El script valida metadatos y búsquedas por CUM, registro sanitario y nombre en las cuatro fuentes de medicamentos, y por registro/nombre en dispositivos y las 14 categorías RS/NSO. Ejecuta como máximo dos comprobaciones simultáneas y su salida no incluye el app token. El argumento --registros limita la comprobación a las categorías RS/NSO.

## Facturas PDF

La pantalla principal lista facturas; /inn/invima/facturas/:id permite revisar sus renglones y verificar los productos incluidos. /inn/invima/sin-factura conserva los registros anteriores. Se admiten medicamentos, dispositivos y reactivos; SIN_CLASIFICAR no se consulta hasta que el usuario elija un tipo.

- POST facturas: multipart con un único archivo en el campo archivo; devuelve BORRADOR y sus renglones. Se usa pdf-parse 2.4.5 en un proceso hijo terminable, sin escribir el PDF al disco. Node debe ser compatible con pdf-parse (validado en Node 24.21).
- GET facturas?pagina=1&limite=20&q=&estado=BORRADOR: lista paginada con conteos calculados sobre las últimas versiones, sin consultar INVIMA. El filtro opcional estado admite BORRADOR o REVISADA. El total corresponde al filtro; resumen incluye total, borradores y revisadas de toda la búsqueda, antes de aplicar estado y paginación. GET facturas/:id incluye los renglones, originales y resultados actuales.
- PUT facturas/:id: version, numero, proveedor, nitProveedor, fecha (AAAA-MM-DD o null) y renglones. Cada renglón lleva id si ya existe, productoVersion si tiene producto, tipo, descripcion, codigoDeclarado, registroSanitario y excluido. Los campos originales, usuario y contexto no se aceptan del cliente. Deben enviarse también los renglones excluidos; no se borran los omitidos.
- DELETE facturas/:id?version=1: borrado lógico de cualquier factura, borrador o revisada, devuelve 204. Exige la versión actual y administrador o permiso 006005002; las versiones desactualizadas reciben 409 y los IDs ajenos al contexto o ya eliminados reciben 404. En una transacción bloquea la factura, guarda FECHAELIMINA y ELIMINADOPOR, actualiza auditoría e incrementa la versión sin modificar el estado de revisión ni borrar renglones, productos, verificaciones o confirmaciones. El listado solicita confirmación y ofrece la acción en todas las facturas.
- La migración de borrado lógico añade columnas anulables y sustituye la unicidad global del hash por un índice único filtrado a facturas activas. Se puede volver a cargar el mismo PDF con una identidad nueva, conservando la factura eliminada y su evidencia. TypeORM excluye automáticamente las facturas eliminadas del listado, conteos, búsquedas de duplicados y detalle. Sus productos tampoco aparecen en el listado general ni en «Sin factura» y rechazan edición, verificación, confirmación e historial mediante la API. Las escrituras bloquean primero la factura y después sus productos, para coordinar eliminación con revisión o verificaciones en curso. No se incorpora una interfaz de restauración ni un endpoint de borrado físico.
- Guardar crea/actualiza productos en una transacción. Cada renglón tiene identidad propia, incluso si repite CUM. Cambiar sus datos reinicia solo su verificación; conserva el historial y el fragmento original. Los productos vinculados se editan desde su factura.
- Se guardan metadatos, nombre y hash del archivo, formato y versión del extractor, fragmentos de renglones, páginas y advertencias. No se conserva el PDF ni el texto completo de sus páginas. El hash detecta cargas repetidas dentro del contexto.

Se reconocen los formatos suministrados de Evedisa, Offimedicas, Xinetix, Sicmafarma, Life, Laboratorios Delta, Vantive, Laboratorios Baxter, Cruz Verde y B. Braun. El extractor versión 2 agrega los últimos cinco formatos y registros sanitarios MB. Las verificaciones y extracciones guardadas conservan su versión original.

Hay reglas para continuaciones entre páginas, CUM seguido inmediatamente por IUM y múltiples lotes por renglón. Delta distingue el IUM de un CUM, conserva el código en el fragmento y muestra una advertencia; reconoce registros MB partidos entre líneas. Cruz Verde conserva ceros iniciales y reconstruye CUM divididos entre líneas. Baxter y Vantive leen el CUM de su columna, sin confundirlo con lote, fecha o referencia; se conservan los renglones facturados separados aunque repitan CUM. Los renglones sin identificadores quedan para clasificación/revisión manual. B. Braun utiliza el registro sanitario de dispositivo y conserva referencias, expediente y lotes solo como evidencia; no los convierte en CUM. Se omiten las páginas de totales sin productos.

Los formatos desconocidos permiten revisión/captura manual. N.A., identificadores ambiguos y códigos incompletos permanecen visibles; no se inventa un consecutivo de CUM. Agregar formatos no modifica facturas ya guardadas ni requiere migración SQL.

Los límites predeterminados son 10 MB, 50 páginas, 500 renglones y 30 segundos. INVIMA_PDF_MAX_BYTES, INVIMA_PDF_MAX_PAGES, INVIMA_PDF_MAX_ROWS e INVIMA_PDF_TIMEOUT_MS permiten reducirlos. Hay como máximo dos extracciones concurrentes por proceso; las adicionales reciben HTTP 429. PDF sin texto, protegido, dañado, excesivo o con tiempo agotado tiene un error específico. No se incluye OCR.

Para validar localmente los originales (solo lectura de archivos, sin guardar facturas):

    node -r ts-node/register inventario/scripts/verificar-facturas-invima.ts <ruta.pdf> [otras-rutas.pdf]

Este script verifica las doce muestras disponibles (120 renglones), número y fecha de factura, asociaciones de descripción/CUM, ceros iniciales, separación de IUM, registros MB, dispositivos y continuidad de página. Los cinco formatos nuevos aportan 6 renglones de Delta, 3 de Vantive, 30 de Baxter, 13 de Cruz Verde y 2 de B. Braun. Las pruebas automatizadas utilizan documentos sintéticos; los PDF originales no forman parte del repositorio.

## Dispositivos y reactivos

INVIMA_DATASET_DISPOSITIVOS configura la quinta fuente (por defecto y4qt-w6tk). Su campo de nombre se llama prodcuto en la API. Se consultan registro_sanitario y después nombre, con deduplicación de roles, paginación estable, metadatos, plazo y reintento del cliente común. El registro puede tener varias marcas o presentaciones: la asociación siempre necesita confirmación manual.

Los números que una factura de dispositivos rotula CUM quedan en codigoDeclarado; no se transforman en CUM de medicamentos. Los candidatos de esta fuente devuelven cum y estadoCum en null, y conservan estadoRegistro, grupo, marca y fechas publicadas. La interfaz muestra Estado CUM: No aplica. Una fuente fallida significa INCOMPLETA, nunca SIN_COINCIDENCIAS.

## API de productos y persistencia

- GET/POST productos: listar o registrar.
- El listado incluye cumVerificado y estadoCum, ambos anulables. Se extraen de la coincidencia confirmada o exacta de la última verificación de la versión actual, sin consultar nuevamente a INVIMA ni descargar el historial. Crear o editar devuelve ambos campos en null.
- PUT productos/:id: editar; exige version actual y deja solo ese producto pendiente, conservando el historial. Los productos de facturas revisadas se pueden editar individualmente: codigoDeclarado (opcional, texto de hasta 120 caracteres) corrige el código del renglón. La transacción bloquea primero la factura, sincroniza el renglón y producto e incrementa la versión y auditoría de la factura. Rechaza renglones excluidos y versiones de producto desactualizadas. No modifica el texto original del PDF. Una revisión completa posterior conserva laboratorio, concentración, forma y presentación añadidos desde la edición individual.
- POST productos/:id/verificaciones: consultar y guardar una nueva evidencia.
- GET productos/:id/verificaciones: historial de versiones, consultas y confirmaciones.
- GET productos/:id/verificaciones/:verificacionId/candidatos?fuenteId=vigentes&offset=20: siguiente página de 20 candidatos.
- POST productos/:id/verificaciones/:verificacionId/confirmacion con clave: confirmar un candidato ya guardado como evidencia.

Cada consulta conserva datos ingresados, páginas consultadas, errores, versión del producto y fecha de actualización de las fuentes. Las confirmaciones son registros separados; no sobrescriben el resultado original. Una fuente fallida implica resultado INCOMPLETA y bloquea la confirmación hasta repetir la consulta.

El selector incluye 15 categorías de productos verificables, más DISPOSITIVO (general, compatible con los datos anteriores) y SIN_CLASIFICAR. Medicamentos mantiene únicamente las cuatro fuentes CUM; las otras 14 categorías consultan RS/NSO. Los tipos se guardan en el JSON existente; no requieren migración SQL ni reclasificación de productos guardados.

## Registros sanitarios y NSO por categoría

INVIMA_DATASET_REGISTROS_GENERALES configura la fuente registros (por defecto ui32-p9f2). Incluye alimentos, aseo y limpieza, bebidas alcohólicas, biológicos, cosméticos, fitoterapéuticos, homeopáticos, médico quirúrgicos, medicamentos oficinales, odontológicos, plaguicidas, reactivo diagnóstico, reactivos in vitro y suplementos dietarios. GRUPOS_REGISTROS conserva los valores exactos oficiales, incluidos MED. OFICINALES y REACTIVOS  IN VITRO (dos espacios). OPERACIONES y Radiofármacos no se ofrecen. DISPOSITIVO sigue usando y4qt-w6tk; las evidencias anteriores de médico quirúrgicos conservan esa fuente y su paginación.

Toda consulta RS/NSO exige el grupo guardado en la fuente y lo aplica también al paginar, aunque el filtro recibido internamente sea true. Se busca por rsynso y después por producto. El adaptador recupera titular, estadoregistro, grupo, expediente y fechas originales; cum y estadoCum son null y no se inventan presentación ni forma farmacéutica. Los metadatos y la lista de grupos publicados se validan y cachean cinco minutos: un grupo ausente, esquema incompatible o respuesta de otro grupo genera consulta incompleta. No se consulta esa categoría en los CUM ni se amplía a otros grupos cuando no hay resultados.

Los candidatos RS/NSO necesitan confirmación manual, aun si hay uno solo por registro. Su fuente y grupo quedan en el historial; el endpoint de candidatos admite fuenteId=registros. El estado CUM de alimentos, dispositivos y médico quirúrgicos es «No aplica»; las demás categorías RS/NSO muestran «No disponible en esta fuente». El estado del registro se toma del candidato exacto o confirmado, sin deducir vigencia a partir de fechas. Una búsqueda sin resultados solo describe la cobertura de la fuente y el grupo consultados.

El CUM exacto solo se asocia automáticamente con cobertura completa y sin contradicciones. Los registros sanitarios y nombres generan candidatos para revisar. Las filas repetidas por ingredientes o roles se deduplican en la consulta SoQL usando los campos de identidad/presentación. La concentración de las fuentes CUM no se interpreta como una concentración clínica comparable.

Los formatos de fecha de las fuentes se conservan como texto, incluido el año 3000. Las fechas de auditoría se presentan en America/Bogota. Al cambiar una fuente se impide mezclar nuevas páginas con una evidencia previa.

## Operación

### Observaciones e informe PDF

Aplicar `inventario/database/migrations/20261022_invima_observaciones.sql` en cada contexto antes de actualizar el backend. Añade texto, versión independiente y auditoría de observaciones a facturas y renglones, sin modificar productos ni verificaciones anteriores. Las notas se conservan al editar productos, revisar de nuevo, excluir renglones o eliminar lógicamente una factura.

Después de guardar la revisión, el detalle permite una observación general y una por producto incluido (hasta 4000 caracteres cada una). El cliente guarda tras 700 ms sin escritura y al salir del campo, serializa cambios de un mismo campo y reintenta fallos transitorios hasta tres intentos. Muestra el estado del guardado; conserva el borrador local ante fallos. La navegación y la descarga esperan los cambios pendientes. Cerrar o recargar el navegador con cambios sin confirmar muestra la advertencia nativa. Un conflicto con otra persona permite elegir explícitamente el texto que se conservará.

- `PATCH facturas/:id/observaciones`: `{ texto, version, renglonId? }`. Omitir `renglonId` actualiza la observación general. Devuelve `{ texto, version, usuarioNombre, fecha }`; la versión inicial es 0. La auditoría y el contexto provienen de la sesión. La escritura bloquea primero la factura y no incrementa la versión de revisión/producto ni reinicia verificaciones. Un texto idéntico es idempotente; un conflicto devuelve HTTP 409 con `actual`. Facturas borrador reciben 400 y facturas eliminadas, ajenas al contexto o renglones no incluidos reciben 404.
- `GET facturas/:id/informe.pdf`: descarga privada sin caché, disponible para facturas revisadas. Usa una instantánea consistente de metadatos, observaciones y últimas verificaciones de la versión vigente de cada producto, con fuentes, coincidencias confirmadas/exactas, estados separados, advertencias y auditoría en Colombia. Los productos pendientes se identifican claramente. No consulta INVIMA ni almacena un PDF nuevo.

El informe usa Puppeteer ya incluido en el proyecto. El servidor necesita el Chromium instalado por Puppeteer; `INVIMA_PDF_BROWSER_PATH` permite señalar un ejecutable compatible en el despliegue. No requiere cambiar `.env` en desarrollo cuando el navegador predeterminado ya está instalado. El HTML escapa todos los datos, deshabilita JavaScript y bloquea peticiones de recursos externos. Admite dos informes simultáneos por proceso; los adicionales reciben 503. La preparación del navegador tiene un límite de 15 s y la impresión 30 s, con cierre de recursos incluso ante fallos. Un error al generar el PDF no borra las notas.

Informe sintético de aceptación (sin acceso a bases de datos), desde `inventario`:

    node -r ts-node/register -r tsconfig-paths/register scripts/verificar-informe-invima.ts

Genera `dist/invima-qa/observaciones.pdf` con notas multilínea, nota extensa, CUM inactivo con registro vigente, consultas incompletas, dispositivos y productos pendientes. Revisar las páginas renderizadas antes de cambiar su diseño.

Las peticiones externas tienen un límite de 12 segundos y como máximo un reintento ante fallos transitorios. Los metadatos se guardan en memoria durante cinco minutos; las páginas adicionales comprueban la versión de la fuente. La pantalla procesa como máximo dos productos simultáneos y permite reintentar cada producto fallido. Salir detiene el envío de nuevas consultas; las peticiones ya enviadas pueden terminar y quedar en el historial.

No se modifican el catálogo INNPRODUC ni las recepciones técnicas. La migración no se ejecuta automáticamente al iniciar el backend.

## Diagnóstico de conexión

Si se modifica el archivo .env, reiniciar el proceso de Inventario: dotenv se ejecuta al iniciar y las conexiones existentes mantienen el servidor anterior. Ejecutar la migración sobre una base distinta de la conexión activa no habilita el módulo.

Si cambian las conexiones, reiniciar también General (autenticación, puerto 8101) y volver a iniciar sesión. Los dos procesos deben consultar la misma base para autenticar al usuario y resolver sus permisos. El alias admin del frontend en desarrollo no concede permisos en el backend.

La ausencia de cualquiera de las tres tablas devuelve HTTP 503 con código INVIMA_MIGRACION_PENDIENTE y un mensaje de configuración. No se interpreta como una lista vacía ni se crean tablas automáticamente. Otros errores SQL conservan el tratamiento habitual del backend.

/* DIAGNOSTICO MANUAL DE SOLO LECTURA. Seleccione la base de la SEDE/CONTEXTO.
   Ejemplo: DGEMPRES99 cuando esa es la base configurada para la sede de pruebas.
   No crea, modifica ni elimina datos u objetos; no cambia de base.
   Para reproducir la visibilidad del backend, ejecútelo con la misma cuenta SQL
   que utiliza la conexión de esa sede. No comparta contraseñas ni cadenas de conexión.
   OBJECT_ID puede ser NULL tanto por ausencia del objeto como por falta de visibilidad.
*/

SELECT DB_NAME() AS BaseActual,
       CONVERT(nvarchar(128),SERVERPROPERTY(N'ServerName')) AS ServidorActual,
       USER_NAME() AS UsuarioBase,
       SCHEMA_NAME() AS EsquemaPredeterminado;

;WITH Esperadas(Tabla) AS (
    SELECT Tabla FROM (VALUES
        (N'EKSLNPREAUDINSTALACION'),
        (N'EKSLNPREAUDITORIA'),
        (N'EKSLNPREAUDHALLAZGO'),
        (N'EKSLNPREAUDREVISION'),
        (N'EKSLNPREAUDBORRADOR'),
        (N'EKSLNPREAUDHISTORIAL'),
        (N'EKSLNPREAUDENTREGA'),
        (N'EKSLNPREAUDENTREGADETALLE'),
        (N'EKSLNPREAUDNOTIFICACION'),
        (N'EKSLNPREAUDCONFIGURACION'),
        (N'EKSLNPREAUDCUP'),
        (N'EKSLNPREAUDSALARIO'),
        (N'EKSLNPREAUDHORA'),
        (N'EKSLNPREAUDHORAHISTORIAL')
    ) v(Tabla)
)
SELECT e.Tabla,
       N'dbo' AS EsquemaEsperado,
       SCHEMA_NAME(t.schema_id) AS EsquemaVisible,
       OBJECT_ID(N'dbo.'+e.Tabla,N'U') AS ObjetoDbo,
       HAS_PERMS_BY_NAME(N'dbo.'+e.Tabla,N'OBJECT',N'SELECT') AS PuedeConsultar,
       CASE WHEN OBJECT_ID(N'dbo.'+e.Tabla,N'U') IS NULL
            THEN N'No existe en dbo o la cuenta no puede verlo'
            WHEN ISNULL(HAS_PERMS_BY_NAME(N'dbo.'+e.Tabla,N'OBJECT',N'SELECT'),0)<>1
            THEN N'Objeto visible; falta permiso SELECT'
            ELSE N'Objeto visible con permiso SELECT' END AS Diagnostico
FROM Esperadas e
LEFT JOIN sys.tables t ON t.name=e.Tabla
ORDER BY e.Tabla,EsquemaVisible;

IF OBJECT_ID(N'dbo.EKSLNPREAUDINSTALACION',N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.EKSLNPREAUDINSTALACION',N'Id') IS NOT NULL
   AND COL_LENGTH(N'dbo.EKSLNPREAUDINSTALACION',N'Version') IS NOT NULL
   AND HAS_PERMS_BY_NAME(N'dbo.EKSLNPREAUDINSTALACION',N'OBJECT',N'SELECT')=1
BEGIN
    EXEC sys.sp_executesql N'SELECT Id,Version FROM dbo.EKSLNPREAUDINSTALACION WHERE Id=1;';
END
ELSE
BEGIN
    SELECT N'No se pudo leer el marcador de instalación: tabla/columnas ausentes, no visibles o sin permiso SELECT para esta cuenta.' AS DiagnosticoVersion;
END;

/* EJECUCION MANUAL OPTATIVA. Seleccione la base de la SEDE/CONTEXTO donde creó las tablas anteriores.
   ELIMINA DEFINITIVAMENTE LAS 14 TABLAS ANTERIORES Y TODOS SUS DATOS.
   Ejecute solo si desea descartar la instalación anterior de Preauditoría.
   Detenga el uso del módulo durante la sustitución de las tablas y el backend.
   Después ejecute 001-estructura-central.sql y 002-configuracion-central.sql en esta misma sede.
   Sus nombres históricos se conservan; la instalación y los datos son propios de cada contexto.

   Alcance: exclusivamente la lista explícita dbo.EKPRE_* que figura abajo.
   Conserva las tablas EKSLNPREAUD..., las de Dinámica y los permisos ya registrados.
   Se detiene si otras tablas tienen claves foráneas hacia las tablas anteriores.
   Una falla revierte el bloque completo. Las tablas que ya no existen se omiten.
   No cambia de base, no elimina bases ni modifica otros esquemas.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF @@TRANCOUNT <> 0
    THROW 51010,N'Ejecute este script por separado, sin una transacción abierta.',1;

BEGIN TRY
BEGIN TRANSACTION;

DECLARE @Anteriores TABLE(Nombre sysname PRIMARY KEY);
INSERT @Anteriores(Nombre) VALUES
(N'EKPRE_EntregaDetalle'),
(N'EKPRE_Notificacion'),
(N'EKPRE_Borrador'),
(N'EKPRE_Hallazgo'),
(N'EKPRE_Revision'),
(N'EKPRE_Entrega'),
(N'EKPRE_Historial'),
(N'EKPRE_HoraHistorial'),
(N'EKPRE_Hora'),
(N'EKPRE_Salario'),
(N'EKPRE_Cup'),
(N'EKPRE_Configuracion'),
(N'EKPRE_Auditoria'),
(N'EKPRE_Instalacion');

IF EXISTS(
    SELECT 1
    FROM sys.foreign_keys fk
    JOIN sys.tables destino ON destino.object_id=fk.referenced_object_id
    JOIN @Anteriores a ON a.Nombre=destino.name AND destino.schema_id=SCHEMA_ID(N'dbo')
    JOIN sys.tables origen ON origen.object_id=fk.parent_object_id
    WHERE origen.schema_id<>SCHEMA_ID(N'dbo')
       OR NOT EXISTS(SELECT 1 FROM @Anteriores x WHERE x.Nombre=origen.name)
)
BEGIN
    SELECT SCHEMA_NAME(origen.schema_id) AS Esquema,
           origen.name AS TablaDependiente, fk.name AS Restriccion,
           destino.name AS TablaAnterior
    FROM sys.foreign_keys fk
    JOIN sys.tables destino ON destino.object_id=fk.referenced_object_id
    JOIN @Anteriores a ON a.Nombre=destino.name AND destino.schema_id=SCHEMA_ID(N'dbo')
    JOIN sys.tables origen ON origen.object_id=fk.parent_object_id
    WHERE origen.schema_id<>SCHEMA_ID(N'dbo')
       OR NOT EXISTS(SELECT 1 FROM @Anteriores x WHERE x.Nombre=origen.name);
    THROW 51011,N'Otras tablas dependen de la instalación anterior. Revise las dependencias mostradas; no se eliminó ninguna tabla.',1;
END;

IF OBJECT_ID(N'dbo.EKPRE_EntregaDetalle',N'U') IS NOT NULL
    DROP TABLE dbo.EKPRE_EntregaDetalle;
IF OBJECT_ID(N'dbo.EKPRE_Notificacion',N'U') IS NOT NULL
    DROP TABLE dbo.EKPRE_Notificacion;
IF OBJECT_ID(N'dbo.EKPRE_Borrador',N'U') IS NOT NULL
    DROP TABLE dbo.EKPRE_Borrador;
IF OBJECT_ID(N'dbo.EKPRE_Hallazgo',N'U') IS NOT NULL
    DROP TABLE dbo.EKPRE_Hallazgo;
IF OBJECT_ID(N'dbo.EKPRE_Revision',N'U') IS NOT NULL
    DROP TABLE dbo.EKPRE_Revision;
IF OBJECT_ID(N'dbo.EKPRE_Entrega',N'U') IS NOT NULL
    DROP TABLE dbo.EKPRE_Entrega;
IF OBJECT_ID(N'dbo.EKPRE_Historial',N'U') IS NOT NULL
    DROP TABLE dbo.EKPRE_Historial;
IF OBJECT_ID(N'dbo.EKPRE_HoraHistorial',N'U') IS NOT NULL
    DROP TABLE dbo.EKPRE_HoraHistorial;
IF OBJECT_ID(N'dbo.EKPRE_Hora',N'U') IS NOT NULL
    DROP TABLE dbo.EKPRE_Hora;
IF OBJECT_ID(N'dbo.EKPRE_Salario',N'U') IS NOT NULL
    DROP TABLE dbo.EKPRE_Salario;
IF OBJECT_ID(N'dbo.EKPRE_Cup',N'U') IS NOT NULL
    DROP TABLE dbo.EKPRE_Cup;
IF OBJECT_ID(N'dbo.EKPRE_Configuracion',N'U') IS NOT NULL
    DROP TABLE dbo.EKPRE_Configuracion;
IF OBJECT_ID(N'dbo.EKPRE_Auditoria',N'U') IS NOT NULL
    DROP TABLE dbo.EKPRE_Auditoria;
IF OBJECT_ID(N'dbo.EKPRE_Instalacion',N'U') IS NOT NULL
    DROP TABLE dbo.EKPRE_Instalacion;

COMMIT TRANSACTION;
PRINT N'Tablas anteriores eliminadas de ' + QUOTENAME(DB_NAME()) + N'. Ejecute 001 y 002 en esta misma base de la sede.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

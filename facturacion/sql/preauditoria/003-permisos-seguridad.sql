/* EJECUCION MANUAL en CADA base de seguridad clínica que se habilitará.
   Seleccione la base antes de ejecutar; este archivo no cambia de base automáticamente.
   Registra el submódulo 004007 y sus permisos. No concede permisos ni crea usuarios/roles.
   Después asigne los permisos desde la administración de Eklipse.
   Coordinación: consultar equipo + recibir/asignar/reabrir/entregar/informes según funciones.
   Auditor: auditar (consulta propia) y, si corresponde, informes y horas extras.
   Salarios requiere su permiso independiente. Admin conserva acceso dentro de su contexto.
   Reejecutable: las colisiones de códigos o nombres provocan rollback.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF OBJECT_ID('dbo.GENUSUARIO','U') IS NULL OR OBJECT_ID('dbo.GCMMODULOS','U') IS NULL
 OR OBJECT_ID('dbo.EKGENMODULO','U') IS NULL OR OBJECT_ID('dbo.EKGENSUBMODULO','U') IS NULL
 THROW 51000,N'Esta base no contiene las estructuras de seguridad requeridas de Eklipse.',1;
BEGIN TRY
BEGIN TRANSACTION;
IF (SELECT COUNT(*) FROM dbo.EKGENMODULO WITH(UPDLOCK,HOLDLOCK) WHERE CODIGO='004')<>1
 THROW 51001,N'Debe existir un único módulo de Facturación con código 004.',1;
DECLARE @Modulo int=(SELECT OID FROM dbo.EKGENMODULO WHERE CODIGO='004');
IF (SELECT COUNT(*) FROM dbo.EKGENSUBMODULO WHERE EKGENMODULO=@Modulo AND CODIGO='007')>1
 THROW 51002,N'El código de submódulo 007 está duplicado.',1;
IF EXISTS(SELECT 1 FROM dbo.EKGENSUBMODULO WHERE EKGENMODULO=@Modulo AND CODIGO='007' AND UPPER(NOMBRE)<>N'PREAUDITORÍA')
 THROW 51003,N'El código 004007 pertenece a otro submódulo. No se reemplazó.',1;
IF NOT EXISTS(SELECT 1 FROM dbo.EKGENSUBMODULO WHERE EKGENMODULO=@Modulo AND CODIGO='007')
 INSERT dbo.EKGENSUBMODULO(CODIGO,NOMBRE,ACTIVO,EKGENMODULO) VALUES('007',N'PREAUDITORÍA',1,@Modulo);
DECLARE @Submodulo int=(SELECT OID FROM dbo.EKGENSUBMODULO WHERE EKGENMODULO=@Modulo AND CODIGO='007');
DECLARE @Permisos TABLE(Codigo varchar(3) PRIMARY KEY,Nombre nvarchar(200));
INSERT @Permisos VALUES
 ('001',N'PREAUDITORÍA - CONSULTAR EQUIPO'),('002',N'PREAUDITORÍA - RECIBIR'),
 ('003',N'PREAUDITORÍA - ASIGNAR'),('004',N'PREAUDITORÍA - AUDITAR'),
 ('005',N'PREAUDITORÍA - REABRIR Y ANULAR'),('006',N'PREAUDITORÍA - ENTREGAR'),
 ('007',N'PREAUDITORÍA - INFORMES'),('008',N'PREAUDITORÍA - CONFIGURAR'),
 ('009',N'PREAUDITORÍA - SALARIOS'),('010',N'PREAUDITORÍA - HORAS EXTRAS');
IF EXISTS(SELECT 1 FROM @Permisos p JOIN dbo.GCMMODULOS a ON a.EKGENMODULO=@Modulo AND a.EKGENSUBMODULO=@Submodulo AND a.EKCODIGO=p.Codigo
 WHERE UPPER(a.NOMBRE)<>p.Nombre)
 THROW 51004,N'Hay una colisión en los códigos de permisos. No se reemplazaron permisos existentes.',1;
IF EXISTS(SELECT a.EKCODIGO FROM dbo.GCMMODULOS a JOIN @Permisos p ON p.Codigo=a.EKCODIGO
 WHERE a.EKGENMODULO=@Modulo AND a.EKGENSUBMODULO=@Submodulo GROUP BY a.EKCODIGO HAVING COUNT(*)>1)
 THROW 51005,N'Hay códigos de permisos duplicados. Revise la seguridad existente.',1;
INSERT dbo.GCMMODULOS(EKCODIGO,NOMBRE,ACTIVO,EKGENMODULO,EKGENSUBMODULO)
SELECT p.Codigo,p.Nombre,1,@Modulo,@Submodulo FROM @Permisos p
WHERE NOT EXISTS(SELECT 1 FROM dbo.GCMMODULOS a WITH(UPDLOCK,HOLDLOCK)
 WHERE a.EKGENMODULO=@Modulo AND a.EKGENSUBMODULO=@Submodulo AND a.EKCODIGO=p.Codigo);
COMMIT TRANSACTION;
PRINT N'Permisos registrados. Asígnelos mediante la administración de Eklipse y renueve la sesión.';
END TRY
BEGIN CATCH
 IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
 THROW;
END CATCH;

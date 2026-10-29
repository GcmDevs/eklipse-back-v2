/* EJECUCION MANUAL en la misma base de la SEDE/CONTEXTO donde ejecutó 001.
   Complete @Contexto con el código de la sesión que usará esta base.
   Registra únicamente la configuración de ese contexto; no crea datos de otras sedes.
   No cambia valores ya configurados. El nombre histórico del archivo se conserva.
   Causales y CUPS se distribuyen como catálogos JSON versionados con el backend;
   los CUPS personalizados se guardan en EKSLNPREAUDCUP. No se ejecuta SQL al iniciar la aplicación.
   Plazos expresados en horas corridas. Puede ajustarlos después desde Eklipse.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
DECLARE @Contexto nvarchar(30)=N''; -- ALTACENTRO, AGUACHICA, AMMEDICAL, SANJUAN o VALLEDUPAR.
IF @Contexto NOT IN(N'ALTACENTRO',N'AGUACHICA',N'AMMEDICAL',N'SANJUAN',N'VALLEDUPAR')
 THROW 51001,N'Complete @Contexto con el código de la sede correspondiente a esta base antes de ejecutar.',1;
IF OBJECT_ID('dbo.EKSLNPREAUDINSTALACION','U') IS NULL THROW 51000,N'Primero ejecute 001 en esta misma base de la sede.',1;
BEGIN TRY
BEGIN TRANSACTION;
INSERT dbo.EKSLNPREAUDCONFIGURACION(Contexto,Payload)
SELECT @Contexto,N'{"sinAsignar":24,"auditoria":24,"entrega":24}'
WHERE NOT EXISTS(SELECT 1 FROM dbo.EKSLNPREAUDCONFIGURACION x WITH(UPDLOCK,HOLDLOCK) WHERE x.Contexto=@Contexto);
COMMIT TRANSACTION;
PRINT N'Configuración de Preauditoría lista para ' + @Contexto + N' en ' + QUOTENAME(DB_NAME()) + N'.';
END TRY
BEGIN CATCH
 IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
 THROW;
END CATCH;

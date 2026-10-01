/*
  Saneamiento controlado de asignaciones activas de Conteo 3.

  Por seguridad, el script revierte sus cambios mientras @Aplicar sea 0.
  Revise primero el listado y cambie @Aplicar a 1 solamente durante una
  ventana de mantenimiento autorizada.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0;

BEGIN TRANSACTION;

SELECT
  OID AS asignacionId,
  USUARIOCONTEO AS usuarioConteoId,
  ESTANTE AS estanteId,
  CICLO AS cicloId,
  NUMEROCONTEO AS numeroConteo,
  ISACTIVO AS isActivo
FROM EKINNASIGNACIONCONTEO
WHERE NUMEROCONTEO = 3
  AND ISACTIVO = 1;

UPDATE EKINNASIGNACIONCONTEO
SET
  ISACTIVO = 0,
  FECHAMODIFICACION = GETDATE()
WHERE NUMEROCONTEO = 3
  AND ISACTIVO = 1;

SELECT @@ROWCOUNT AS asignacionesConteo3Desactivadas;

IF @Aplicar = 1
BEGIN
  COMMIT TRANSACTION;
END
ELSE
BEGIN
  ROLLBACK TRANSACTION;
  PRINT 'Simulacion finalizada: no se aplicaron cambios. Establezca @Aplicar = 1 para confirmar.';
END;

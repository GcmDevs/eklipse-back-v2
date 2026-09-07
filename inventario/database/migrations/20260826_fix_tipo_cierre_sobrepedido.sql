/* Ejecutar en ALTACENTRO, VALLEDUPAR, SANJUAN y AGUACHICA. */
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID('dbo.EKINNSOLPESOBRE', 'U') IS NULL
BEGIN
  ;THROW 50001, 'Debe ejecutar primero la migracion 20260825_solicitud_pedido_sobrepedido.sql.', 1;
END;

DECLARE @tipoActual SYSNAME;

SELECT @tipoActual = tipo.name
FROM sys.columns columna
INNER JOIN sys.types tipo
  ON tipo.user_type_id = columna.user_type_id
WHERE columna.object_id = OBJECT_ID('dbo.EKINNSOLPESOBRE')
  AND columna.name = 'TIPOCIERRE';

IF @tipoActual IS NULL
BEGIN
  ;THROW 50002, 'La tabla EKINNSOLPESOBRE no contiene la columna TIPOCIERRE.', 1;
END;

IF @tipoActual IN ('tinyint', 'smallint', 'int', 'bigint')
   AND EXISTS (
     SELECT 1
     FROM dbo.EKINNSOLPESOBRE
     WHERE TIPOCIERRE NOT IN (1, 2)
   )
BEGIN
  ;THROW 50003, 'TIPOCIERRE contiene codigos distintos de 1 y 2; se requiere revision manual.', 1;
END;

DECLARE @eliminarChecks NVARCHAR(MAX) = N'';

SELECT @eliminarChecks = @eliminarChecks
  + N'ALTER TABLE dbo.EKINNSOLPESOBRE DROP CONSTRAINT '
  + QUOTENAME(nombre.name)
  + N';'
FROM sys.check_constraints nombre
WHERE nombre.parent_object_id = OBJECT_ID('dbo.EKINNSOLPESOBRE')
  AND nombre.definition LIKE '%TIPOCIERRE%';

IF LEN(@eliminarChecks) > 0
BEGIN
  EXEC sys.sp_executesql @eliminarChecks;
END;

IF @tipoActual IN ('tinyint', 'smallint', 'int', 'bigint', 'char', 'nchar', 'varchar', 'nvarchar')
BEGIN
  ALTER TABLE dbo.EKINNSOLPESOBRE
    ALTER COLUMN TIPOCIERRE VARCHAR(24) NOT NULL;

  UPDATE dbo.EKINNSOLPESOBRE
  SET TIPOCIERRE = CASE TIPOCIERRE
    WHEN '1' THEN 'REEMPLAZADO'
    WHEN '2' THEN 'CERRADO_SIN_TRASLADO'
    ELSE TIPOCIERRE
  END;
END
ELSE
BEGIN
  ;THROW 50004, 'El tipo actual de TIPOCIERRE no se puede migrar automaticamente.', 1;
END;

IF EXISTS (
  SELECT 1
  FROM dbo.EKINNSOLPESOBRE
  WHERE TIPOCIERRE NOT IN ('REEMPLAZADO', 'CERRADO_SIN_TRASLADO')
)
BEGIN
  ;THROW 50005, 'TIPOCIERRE contiene valores no reconocidos; se requiere revision manual.', 1;
END;

ALTER TABLE dbo.EKINNSOLPESOBRE
  ADD CONSTRAINT CK_EKINNSOLPESOBRE_TIPO
    CHECK (TIPOCIERRE IN ('REEMPLAZADO', 'CERRADO_SIN_TRASLADO'));

COMMIT TRANSACTION;

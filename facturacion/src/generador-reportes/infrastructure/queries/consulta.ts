// Parámetros posicionales de TypeORM para SQL Server. No interpolar datos del usuario.
export const PACIENTE_REPORTES_SQL = `SELECT TOP (2)
  OID, PACNUMDOC, PACPRINOM, PACSEGNOM, PACPRIAPE, PACSEGAPE,
  CONVERT(char(10), GPAFECNAC, 23) AS GPAFECNAC,
  CASE GPASEXPAC
    WHEN 0 THEN 'Ninguno'
    WHEN 1 THEN 'Masculino'
    WHEN 2 THEN 'Femenino'
    WHEN 3 THEN 'Indefinido'
    ELSE 'No registrado'
  END AS SEXO
FROM GENPACIEN
WHERE PACNUMDOC = @0`;

export const INGRESOS_REPORTES_SQL = `SELECT AINCONSEC, AINFECING,
  CASE AINESTADO
    WHEN 0 THEN 'Registrado'
    WHEN 1 THEN 'Facturado'
    WHEN 2 THEN 'Anulado'
    WHEN 3 THEN 'Bloqueado'
    WHEN 4 THEN 'Cerrado'
    ELSE 'Desconocido'
  END AS ESTADO_INGRESO
FROM ADNINGRESO
WHERE GENPACIEN = @0
ORDER BY AINFECING DESC`;

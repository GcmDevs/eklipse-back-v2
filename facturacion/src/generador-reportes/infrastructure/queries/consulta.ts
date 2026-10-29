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

export const INGRESOS_REPORTES_SQL = `SELECT i.AINCONSEC, i.AINFECING,
  CASE i.AINESTADO
    WHEN 0 THEN 'Registrado'
    WHEN 1 THEN 'Facturado'
    WHEN 2 THEN 'Anulado'
    WHEN 3 THEN 'Bloqueado'
    WHEN 4 THEN 'Cerrado'
    ELSE 'Desconocido'
  END AS ESTADO_INGRESO,
  CASE i.AINURGCON
    WHEN -1 THEN 'Ninguno'
    WHEN 0 THEN 'Urgencias'
    WHEN 1 THEN 'Consulta Externa'
    WHEN 2 THEN 'Nacido en la IPS'
    WHEN 3 THEN 'Remitido'
    WHEN 4 THEN 'Hospitalización de Urgencias'
    WHEN 5 THEN 'Hospitalización'
    WHEN 6 THEN 'Imágenes'
    WHEN 7 THEN 'Laboratorio'
    WHEN 8 THEN 'Urgencia Ginecológica'
    WHEN 9 THEN 'Quirófano'
    WHEN 10 THEN 'Cirugía Ambulatoria'
    WHEN 11 THEN 'Cirugía Programada'
    WHEN 12 THEN 'UCI Neonatal'
    WHEN 13 THEN 'UCI Adulto'
    ELSE 'Desconocido'
  END AS TIPO_INGRESO,
  CASE WHEN i.AINFECEGRE IS NULL AND i.AINESTADO NOT IN (1, 2, 4)
    THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS INGRESO_ACTIVO,
  ubicacion.CAMA_CODIGO, ubicacion.CAMA_NOMBRE, ubicacion.CAMA_UNIDAD
FROM ADNINGRESO i
OUTER APPLY (
  SELECT TOP (1) c.HCACODIGO AS CAMA_CODIGO, c.HCANOMBRE AS CAMA_NOMBRE,
    u.HSUNOMBRE AS CAMA_UNIDAD
  FROM HPNESTANC e
  INNER JOIN HPNDEFCAM c ON c.OID = e.HPNDEFCAM AND c.ADNINGRESO = i.OID
  LEFT JOIN HPNSUBGRU u ON u.OID = c.HPNSUBGRU
  WHERE e.ADNINGRES = i.OID AND e.HESFECSAL IS NULL
    AND i.AINFECEGRE IS NULL AND i.AINESTADO NOT IN (1, 2, 4)
  ORDER BY e.HESFECING DESC, e.OID DESC
) ubicacion
WHERE i.GENPACIEN = @0
ORDER BY AINFECING DESC`;

export const medicamentosQuery = (ingreso: number) => {
  return `
  
SELECT 
N0.OID AS ID, 
N2.ADNINGRESO AS INGRESO, 
N2.HCNUMFOL  AS FOLIO, 
N1.IPRCODIGO AS CODIGO, 
N1.IPRDESCOR AS DESCRIPCION, 
N0.HCSCANTI AS CANTIDAD, 
N0."HCNESTFORM" AS CODIGO_ESTADO,
CASE N0."HCNESTFORM" 
WHEN 0 THEN 'Activa' 
WHEN 1 THEN 'Finalizada' 
WHEN 2 THEN 'Suspendida' 
WHEN 3 THEN 'Vencida' 
END AS ESTADO
from ((("dbo"."HCNMEDPAC" N0 WITH (NOLOCK)
 left join "dbo"."INNPRODUC" N1 WITH (NOLOCK) on (N0."INNPRODUC" = N1."OID"))
 left join "dbo"."INNUNIDAD" N8 WITH (NOLOCK) on (N1."INNUNIDADD" = N8."OID"))
 left join "dbo"."HCNFOLIO" N2 WITH (NOLOCK) on (N0."HCNFOLIO" = N2."OID"))
 where  ((N2."HCFOLABR" = 0) and (N2."ADNINGRESO" = ${ingreso}) and (N0."HCSINTRAH" = 1) and ((N0."HCPTIPORD" = 0) or (N0."HCPTIPORD" = 4)))
  `;
};

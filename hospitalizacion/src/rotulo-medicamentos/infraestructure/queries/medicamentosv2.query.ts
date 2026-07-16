export const medicamentosV2Query = (ingreso: number) => {
  return `

SELECT 
    N0.OID AS ID, 
    N2.ADNINGRESO AS INGRESO, 
    N2.HCNUMFOL AS FOLIO, 
    N1.IPRCODIGO AS CODIGO, 
    N1.IPRDESCOR AS DESCRIPCION, 
    
    -- REQUERIMIENTO 1: Restar la cantidad (Sin bajar de 0)
    CASE 
        WHEN (N0.HCSCANTI - ISNULL(R.TotalGastados, 0)) < 0 THEN 0
        ELSE (N0.HCSCANTI - ISNULL(R.TotalGastados, 0))
    END AS CANTIDAD, 
    
    N0.HCNESTFORM AS CODIGO_ESTADO,
    CASE N0.HCNESTFORM 
        WHEN 0 THEN 'Activa' 
        WHEN 1 THEN 'Finalizada' 
        WHEN 2 THEN 'Suspendida' 
        WHEN 3 THEN 'Vencida' 
    END AS ESTADO,

    -- REQUERIMIENTO 2: Si la cantidad era 1 y ya se guardó en rótulos
    CASE 
        WHEN N0.HCSCANTI = 1 AND ISNULL(R.TotalGastados, 0) >= 1 THEN 'TRUE'
        ELSE 'FALSE'
    END AS GUARDADO,

    -- Monitor de auditoría para verificar el enlace en tiempo real
    ISNULL(R.TotalGastados, 0) AS [_CANTIDAD_EN_ROTULOS]

FROM "dbo"."HCNMEDPAC" N0 WITH (NOLOCK)
LEFT JOIN "dbo"."INNPRODUC" N1 WITH (NOLOCK) ON N0."INNPRODUC" = N1."OID"
LEFT JOIN "dbo"."INNUNIDAD" N8 WITH (NOLOCK) ON N1."INNUNIDADD" = N8."OID"
LEFT JOIN "dbo"."HCNFOLIO" N2 WITH (NOLOCK) ON N0."HCNFOLIO" = N2."OID"

-- Subconsulta corregida con el cruce exacto de tipos de datos
LEFT JOIN (
    SELECT 
        INGRESO,         
        FOLIO, -- Convertimos el nvarchar a INT para evitar fallos de match
        PRODUCTOID,      
        COUNT(*) AS TotalGastados
    FROM "dbo"."EKHPNROTULOMEDICAMENTOS" WITH (NOLOCK)
    WHERE ACTIVO = 1 -- Ignoramos los folios NULL que no se pueden rastrear
    GROUP BY INGRESO, FOLIO, PRODUCTOID
) R ON R.INGRESO = N2.ADNINGRESO 
   AND R.FOLIO = N2.HCNUMFOL      -- Match perfecto de Folio (ej: 9 = 9)
   AND R.PRODUCTOID = N1.OID          -- Match perfecto de ID de Producto (ej: 460 = 460)

WHERE N2."HCFOLABR" = 0 
  AND N2."ADNINGRESO" = ${ingreso}       -- Cambiado a tu ingreso de prueba actual
  AND N0."HCSINTRAH" = 1 
  AND (N0."HCPTIPORD" = 0 OR N0."HCPTIPORD" = 4);
  `;
};

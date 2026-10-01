export const getFacturasPorPeriodoQuery = () => {
  return `SELECT
  F.SFANUMFAC factura,
  F.SRFNUMFAC facturaOriginal,
  F.SFATIPDOC tipoDocumento,
  CONVERT(DATE,F.SFAFECFAC) fechaFacturacion,
  F.SFAGENUSU idUsuario,
  F.USUDESCRI nombreUsuario,
  F.SFATOTFAC totalFacturado,
  F.SFAVALREC totalRecuperado,
  F.SFADOCANU fueAnulado,
  F.SFACANANU cantidadAnulada,
  CONVERT(DATE,F.SFAFECANU) fechaAnulacion,
  CONVERT(DATE,F.SRFFECFAC) fechaOriginal,
  F.SRFTOTFAC totalRefacturado,
  C.GDECODIGO codigoPlanBeneficios,
  F.GENDETCON idEntidad,
  F.GDENOMBRE nombreEntidad,
  F.GENTERCER idTercero,
  F.GTRNOMBRE nombreTercero,
  F.ADNCENATE idCentro,
  F.ACANOMBRE nombreCentro,
  F.ADNEGRSER idAreaServicio,
  F.AESNOMBRE nombreAreaServicio,
  I.AINFECING fechaIngreso,
  E.ADEFECSAL fechaEgreso
  FROM GCVUSUFACTUR F
  LEFT JOIN GENDETCON C ON F.GENDETCON = C.OID
  LEFT JOIN ADNINGRESO I ON F.ADNINGRESO = I.OID
  LEFT JOIN ADNEGRESO E ON F.ADNEGRESO = E.OID
  WHERE CONVERT(DATE, F.SFAFECFAC, 103) BETWEEN @0 AND @1 AND F.SFACANANU < 1`;
};

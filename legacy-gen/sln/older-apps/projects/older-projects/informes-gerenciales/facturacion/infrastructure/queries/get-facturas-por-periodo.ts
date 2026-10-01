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
  I.GDECODIGO codigoPlanBeneficios,
F.GENDETCON idEntidad,
  F.GDENOMBRE nombreEntidad,
F.GENTERCER idTercero,
  F.GTRNOMBRE nombreTercero,
  F.ADNCENATE idCentro,
  F.ACANOMBRE nombreCentro,
F.ADNEGRSER idAreaServicio,
  F.AESNOMBRE nombreAreaServicio
      FROM GCVUSUFACTUR F LEFT JOIN GENDETCON I ON F.GENDETCON = I.OID WHERE CONVERT(DATE, F.SFAFECFAC, 103) BETWEEN @0 AND @1 AND F.SFACANANU < 1`;
};

import { GcmContextType } from '@common/domain/types';
import { setComillasForQueryWithArrayString } from '@common/presentation/helpers';
import { almacenesFarmaciaIdsByCtx } from '@local/application/constants';

export const existenciaActualQuery = (payload: {
  addProductosWithoutGrupo?: boolean;
  filterByAlmacenFarmacia?: boolean;
  context?: GcmContextType;
  maxLength?: number;
  pattern?: string;
  findByCodes?: string[];
}): string => {
  const p = payload;

  if (p.filterByAlmacenFarmacia && !p.context) {
    throw new Error('Debe agregar el contexto si filtrará por almacenes de farmacia');
  }

  const pattern = p.pattern
    ? ` AND (INNAGRUPAMI.AGRNOMBRE LIKE '%${p.pattern}%'
    OR INNAGRUPAMI.AGRCODIGO LIKE '%${p.pattern}%')`
    : '';

  const addProductosWithoutGrupo = p.addProductosWithoutGrupo
    ? ''
    : ` AND INNAGRUPAMI.AGRCODIGO != '000'`;

  const findByCodes = p.findByCodes
    ? ` AND INNAGRUPAMI.AGRCODIGO IN(${setComillasForQueryWithArrayString(p.findByCodes)})`
    : '';

  const filterByAlmacenFarmacia = p.filterByAlmacenFarmacia
    ? ` AND INNFISICO.INNALMACE IN(${almacenesFarmaciaIdsByCtx(p.context)})`
    : '';

  return `SELECT ${p.maxLength ? `TOP (${p.maxLength})` : ''}
    INNAGRUPAMI.AGRCODIGO codigoAgrupamiento,
    INNAGRUPAMI.AGRNOMBRE nombreAgrupamiento,
    IPRCOSTPE costoPromedio,
    IPRSTKMIN stockMinimo,
    IPRSTKMAX stockMaximo,
    IPRPUNREP puntoReposicion,
    INNFISICO.INNALMACE almacenId,
    INNALMACE.IALNOMBRE almacenNombre,
    SUM(INNFISICO.IFICANTID) existenciaActual,
    (IPRCOSTPE*SUM(INNFISICO.IFICANTID)) valorTotal
    FROM INNPRODUC 
    LEFT JOIN INNFISICO ON INNFISICO.INNPRODUC = INNPRODUC.OID
    LEFT JOIN INNALMACE ON INNFISICO.INNALMACE = INNALMACE.OID
    INNER JOIN INNAGRUPAMI ON INNAGRUPAMI.OID = INNPRODUC.INNAGRUPAMI
    WHERE  ((IFICANTID + IFICANCOMP) > 0)${addProductosWithoutGrupo}
    ${filterByAlmacenFarmacia}${pattern}${findByCodes}
    GROUP BY INNPRODUC.OID,IPRDESCOR,IPRCOSTPE,IPRSTKMIN,INNFISICO.INNALMACE,
    INNALMACE.IALNOMBRE,IPRSTKMAX,IPRPUNREP,AGRCODIGO,AGRNOMBRE ORDER BY 2
    `;
};

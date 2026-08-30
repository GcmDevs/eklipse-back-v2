import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';

export interface OncoDataI {
  valorUnitario: number;
  valorTotal: number;
  codigoAgrupamiento: string;
  nombreAgrupamiento: string;
  nombreProducto: string;
  codigoProducto: string;
  existencias: number;
  isByAgrupamiento: boolean;
  promedioConsumo: number;
  idAlmacen: number;
  contexto: string;
}

export const QUERY_REPO_ONCO = (justOncologia: boolean, ctx: GcmContextType) => {
  return `select 
INNAGRUPAMI.AGRCODIGO as codigoAgrupamiento, 
INNPRODUC.IPRDESCAGRU nombreAgrupamiento,
INNPRODUC.IPRDESCOR nombreProducto,
IPRCODIGO codigoProducto,
INNFISICO.INNALMACE idAlmacen,
INNPRODUC.IPRCOSTPE valorUnitario,
IsNull(sum(INNFISICO.IFICANTID),0) existencias
from INNPRODUC
left join INNFISICO on INNFISICO.INNPRODUC=INNPRODUC.oid
left join INNALMACE on INNFISICO.INNALMACE=INNALMACE.oid
left join INNAGRUPAMI on INNAGRUPAMI.OID=INNPRODUC.INNAGRUPAMI
where INNPRODUC.IPRBLOQUEO=0
--AND INNAGRUPAMI.AGRCODIGO in('73150', '60003')
AND INNFISICO.INNALMACE IN(${choiceByCtx(ctx)})
${justOncologia ? `and IPRONCOLOG='1'` : ''}
group by INNAGRUPAMI,IPRAGRUPADO,IPRAGRUPAPMI,IPRDESCAGRU,INNPRODUC.IPRCOSTPE,
IPRDESCOR,IPRCODIGO,AGRCODIGO,IPRONCOLOG,INNFISICO.INNALMACE order by 1`;
};

export const choiceByCtx = (ctx: GcmContextType) => {
  switch (ctx) {
    case GCM_CONTEXTS.ALTACENTRO:
      return [2, 39, 101, 105, 106, 153, 155];
    case GCM_CONTEXTS.AGUACHICA:
      return [2];
    case GCM_CONTEXTS.AMMEDICAL:
      return [1];
    case GCM_CONTEXTS.SANJUAN:
      return [29];
    case GCM_CONTEXTS.VALLEDUPAR:
      return [1];
  }
};

import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';
import { ProductoOrm } from '@inn/lgc/ctc/orm/inn/productos';

export interface ResponseBasicI {
  id: number;
  codigo: string;
  nombre: string;
  isByAgrupamiento: boolean;
  nombreGrupo: string;
  stockMinimo: number;
  stockMaximo: number;
  existenciaActual: number;
  puntoReposicion: number;
  promedioConsumo: number;
  valorTotal: number;
  cantidadSolicitada: number;
  detalleFromBackend: ProductoOrm[];
  calculadoFromPromedioConsumo: boolean;
}

export const gruposProductosValidosByCtx = (ctx: GcmContextType) => {
  switch (ctx) {
    case GCM_CONTEXTS.SANJUAN:
      return [];
    case GCM_CONTEXTS.AGUACHICA:
      return [];
    case GCM_CONTEXTS.ALTACENTRO:
      return [];
    case GCM_CONTEXTS.VALLEDUPAR:
      return [];
    case GCM_CONTEXTS.AMMEDICAL:
      return [
        'ELEMENTOS DE ASEO Y LAVANDERIA',
        'MEDICAMENTOS',
        'MATERIAL MEDICO-QUIRURGICO',
        'PAPELERIA Y UTENSILIOS DE ESCRITORIO',
        'ARRIENDO EQUIPO',
      ];
    default:
      throw new Error('No existe contexto con este codigo');
  }
};

export const getExistenciaActualQuery = () => {
  return `SELECT INNAGRUPAMI.OID agrupamientoId,
  IPRCOSTPE costoPromedio,
  IPRSTKMIN stockMinimo,
  IPRSTKMAX stockMaximo,
  IPRPUNREP puntoReposicion,
  SUM(INNFISICO.IFICANTID) existenciaActual
  FROM INNPRODUC
  LEFT JOIN INNFISICO ON INNFISICO.INNPRODUC=INNPRODUC.OID
  INNER JOIN INNAGRUPAMI ON INNAGRUPAMI.OID = INNPRODUC.INNAGRUPAMI
  WHERE  ((IFICANTID + IFICANCOMP) > 0) AND INNAGRUPAMI.AGRCODIGO != '000'
  GROUP BY INNAGRUPAMI.OID, IPRDESCOR,IPRCOSTPE,IPRSTKMIN,IPRSTKMAX,IPRPUNREP,
  AGRCODIGO,AGRNOMBRE ORDER BY 2`;
};

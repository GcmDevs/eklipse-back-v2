import { TanqueoCorreccion, TanqueoEvidenciaLog } from '@inn/operaciones/tanqueos/domain/entities';
import {
  TanqueoCorreccionLigadaRead,
  TanqueoDetalleRead,
  TanqueoInconsistenciaRead,
  TanqueoRead,
} from '@inn/operaciones/tanqueos/domain/reads';

export type CorreccionDetalleTanqueoRow = {
  id: number;
  campo: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  motivo: string;
  inconsistenciaId: number | null;
  usuarioId: number;
  createdAt: Date;
};

export function mapCorreccionDetalleRow(c: TanqueoCorreccion): CorreccionDetalleTanqueoRow {
  return {
    id: c.getId.getValor,
    campo: c.getCampo,
    valorAnterior: c.getValorAnterior,
    valorNuevo: c.getValorNuevo,
    motivo: c.getMotivo,
    inconsistenciaId: c.getInconsistenciaId?.getValor ?? null,
    usuarioId: c.getUsuarioId.getValor,
    createdAt: c.getCreatedAt,
  };
}

export function toCorreccionLigadaRead(
  row: CorreccionDetalleTanqueoRow
): TanqueoCorreccionLigadaRead {
  return {
    id: row.id,
    campo: row.campo,
    motivo: row.motivo,
    fecha: row.createdAt,
    usuarioId: row.usuarioId,
  };
}

export function enriquecerInconsistenciasConCorreccion(
  inconsistencias: TanqueoInconsistenciaRead[],
  correcciones: CorreccionDetalleTanqueoRow[]
): TanqueoInconsistenciaRead[] {
  const porInconsistenciaId = new Map<number, CorreccionDetalleTanqueoRow>();
  for (const c of correcciones) {
    if (c.inconsistenciaId != null) {
      porInconsistenciaId.set(c.inconsistenciaId, c);
    }
  }
  return inconsistencias.map(inc => ({
    ...inc,
    correccion: porInconsistenciaId.has(inc.id)
      ? toCorreccionLigadaRead(porInconsistenciaId.get(inc.id)!)
      : null,
  }));
}

export function buildTanqueoDetalleRead(
  view: TanqueoRead,
  correccionesEntities: TanqueoCorreccion[],
  historialEvidencias: TanqueoEvidenciaLog[]
): TanqueoDetalleRead {
  const correcciones = correccionesEntities.map(mapCorreccionDetalleRow);
  return {
    ...view,
    inconsistencias: enriquecerInconsistenciasConCorreccion(view.inconsistencias, correcciones),
    correcciones,
    historialEvidencias: historialEvidencias.map(l => ({
      id: l.getId.getValor,
      tipoEvidencia: l.getTipoEvidencia,
      accion: l.getAccion,
      mediaAnteriorId: l.getMediaAnteriorId?.getValor ?? null,
      mediaNuevoId: l.getMediaNuevoId?.getValor ?? null,
      tipoDestino: l.getTipoDestino,
      motivo: l.getMotivo,
      usuarioId: l.getUsuarioId.getValor,
      createdAt: l.getCreatedAt,
    })),
  };
}

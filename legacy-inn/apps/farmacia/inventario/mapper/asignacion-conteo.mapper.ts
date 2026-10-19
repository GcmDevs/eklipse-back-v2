// @farmacia/inventario/mapper/asignacion-conteo.mapper.ts

import { AsignacionConteoOrm } from '@orm/inn/inventario';
import { MisAsignacionesResponse } from '../interface';

export class AsignacionConteoMapper {
  static toMisAsignaciones(asignaciones: AsignacionConteoOrm[]): MisAsignacionesResponse[] {
    return asignaciones.map(a => ({
      asignacionId: a.id,
      estanteId: a.estanteId,
      nombre: a.estante?.nombreEstante ?? '',
      numeroConteo: a.numeroConteo,
      estadoEstante: a.estante.estado,
      almacenId: a.estante?.almacenId ?? null,
      nombreAlmacen: (a.estante as any)?.almacen?.nombre ?? null,
      cicloId: a.cicloId ?? null,
      cicloNombre: a.ciclo?.nombre ?? null,
      cicloEstado: a.ciclo?.estado ?? null,
      // fechaAsignacion: a.assignedAt?.toISOString() ?? undefined,
    }));
  }
}

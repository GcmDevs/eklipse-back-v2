import { NivelRiesgo } from '@hpn/estancias-prolongadas/application/enums';
import {
  ActualizarEstanciaProlongadaDto,
  CrearEstanProDto,
} from '@hpn/estancias-prolongadas/presentation/dtos';
import { NotFoundException } from '@nestjs/common';
import {
  DominioAccionesOrm,
  DominioAccionNotificacionOrm,
  GestorEstanciaProlongadaUsuarioOrm,
} from '@orm/hpn/estancias-prolongadas';
import { In, Repository } from 'typeorm';

export function getNotificacionUserIds(
  actions: CrearEstanProDto['acciones'] | ActualizarEstanciaProlongadaDto['acciones']
) {
  return [
    ...new Set(
      (actions ?? [])
        .flatMap(action => action.usuarioIds ?? [])
        .filter(usuarioId => Number.isInteger(usuarioId) && usuarioId > 0)
    ),
  ];
}
export function resolverNivelRiesgo(scoreTotal: number): NivelRiesgo {
  if (scoreTotal >= 41) return NivelRiesgo.ALTO;
  if (scoreTotal >= 21) return NivelRiesgo.MODERADO;
  return NivelRiesgo.BAJO;
}
export async function validarNotificacionUsers(
  usuarioIds: number[],
  gestorUsuarioRp: Repository<GestorEstanciaProlongadaUsuarioOrm>
) {
  if (!usuarioIds.length) return;

  const usuarios = await gestorUsuarioRp.find({
    where: { usuarioId: In(usuarioIds), estado: true },
  });
  const validUsuarioIds = new Set(usuarios.map(usuario => usuario.usuarioId));
  const missingUsuarioIds = usuarioIds.filter(usuarioId => !validUsuarioIds.has(usuarioId));

  if (missingUsuarioIds.length) {
    throw new NotFoundException(
      `Uno o mas usuarios seleccionados para notificacion no existen o estan inactivos: ${missingUsuarioIds.join(
        ', '
      )}`
    );
  }
}
export function crearAccionNotificaciones(
  estanciaProlongadaId: number,
  savedActions: DominioAccionesOrm[],
  requestedActions: CrearEstanProDto['acciones'] | ActualizarEstanciaProlongadaDto['acciones'],
  notificacionRp: Repository<DominioAccionNotificacionOrm>
) {
  return savedActions.flatMap((savedAction, index) => {
    const requestedAction = requestedActions?.[index];
    const usuarioIds = requestedAction?.usuarioIds ?? [];
    const descripcion = `Nueva accion asignada: ${savedAction.accionEspecifica}`;

    return usuarioIds.map(usuarioId =>
      notificacionRp.create({
        usuarioId,
        estanciaProlongadaId,
        accionId: savedAction.id,
        descripcion,
        visto: false,
        fechaVisto: null,
        createdAt: new Date(),
      })
    );
  });
}

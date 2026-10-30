import { GcmContexts } from '@common/application/constants';
import { BadInputError } from '@common/domain/errors';
import { gcmContextFactory } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services';
import { UsuarioOrm } from '@inn/orm/gen';

export async function assertUsuarioExisteEnSede(
  usuarioId: number,
  sede: GcmContexts
): Promise<void> {
  const conn = switchConn(gcmContextFactory(sede));
  const found = await conn.getRepository(UsuarioOrm).findOne({ where: { id: usuarioId } });
  if (!found) {
    throw new BadInputError('El conductor no pertenece a la sede del registro');
  }
}

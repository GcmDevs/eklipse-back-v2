import { BadInputError } from '@common/domain/errors';
import { CanalRegistro, TipoRegistroTanqueo } from '../enums';

export function assertTipoYCanalRegistro(input: {
  tipoRegistro: TipoRegistroTanqueo;
  canalRegistro: CanalRegistro;
  conductorRealId?: number | null;
}): void {
  if (input.canalRegistro !== CanalRegistro.MOVIL && input.canalRegistro !== CanalRegistro.WEB) {
    throw new BadInputError('CANALREGISTRO solo admite MOVIL o WEB');
  }
  if (input.tipoRegistro === TipoRegistroTanqueo.CONDUCTOR && input.conductorRealId != null) {
    throw new BadInputError('CONDUCTORREALOID debe ser nulo cuando TIPOREGISTRO es CONDUCTOR');
  }
  if (input.tipoRegistro === TipoRegistroTanqueo.COORDINADOR && input.conductorRealId == null) {
    throw new BadInputError('CONDUCTORREALOID es obligatorio cuando TIPOREGISTRO es COORDINADOR');
  }
}

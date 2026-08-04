import { _PrivSecEkUserOrm } from '@common/infrastructure/orm/ek-user.orm';
import { ESTADOS_USUARIO } from '@gen/security/domain/types/gen/usuarios';
import { cryptoServices as crypto } from '@common/application/services';
import { USU_EXTS } from '@common/domain/types';
import { PacienteOrm } from '../paciente.orm';

export const dataToUsuExtOrm = async (paciente: PacienteOrm) => {
  const pacAsUser = new _PrivSecEkUserOrm();
  pacAsUser.document = paciente.documento;
  pacAsUser.fullName = paciente.nombreCompleto;
  pacAsUser.password = await crypto.encrypt('123');
  pacAsUser.statusCode = ESTADOS_USUARIO.ACTIVO.getCode();
  pacAsUser.passwordIsReset = true;
  pacAsUser.tipoUsuarioExternoCode = USU_EXTS.GENPACIEN.getCode();
  return pacAsUser;
};

import { ConfDietExtraPayload } from '@lgc/die/application/data-transfers';
import { DietaConfExtraOrm } from '../models/local';

export const dataToConfDieExtra = (
  payload: ConfDietExtraPayload,
  oldEntity: DietaConfExtraOrm | undefined
) => {
  let _: DietaConfExtraOrm;
  if (oldEntity) _ = oldEntity;
  else _ = new DietaConfExtraOrm();

  _.fechaUltimaDietaRegistrada = new Date();
  _.pacienteId = payload.pacienteId;
  _.incluyeDietaFamiliarDesayuno = payload.incluyeDietaFamiliarDesayuno;
  _.incluyeDietaFamiliarAlmuerzo = payload.incluyeDietaFamiliarAlmuerzo;
  _.incluyeDietaFamiliarCena = payload.incluyeDietaFamiliarCena;
  _.incluyeMeriendaDesayuno = payload.incluyeMeriendaDesayuno;
  _.incluyeMeriendaAlmuerzo = payload.incluyeMeriendaAlmuerzo;
  _.incluyeMeriendaCena = payload.incluyeMeriendaCena;
  _.tipoMerienda = payload.tipoMerienda;

  return _;
};

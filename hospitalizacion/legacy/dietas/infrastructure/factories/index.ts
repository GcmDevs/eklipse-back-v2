import { DietaDto } from '@lgc/die/presentation/dtos';
import {
  JornadaType,
  ESTADOS_JORNADA,
  ESTADOS_DIETA,
  DIETAS_EXTRA,
  JornadaCode,
  JORNADAS_DIETA,
} from '@lgc/die/domain/types';
import {
  DieCentroOrm,
  DieJornadaOrm,
  SubgrupoOrm,
  DieSubgrupoOrm,
  DieEstadoOrm,
  DietaConfExtraOrm,
} from '../orm';
import { GcmContextType } from '@common/domain/types';
import { ConfDietExtraPayload } from '@lgc/die/application/data-transfers';
import { valueForDieta } from '@lgc/die/application/constants/prices';

export const dieCentroFactory = (payload: { centroId: number; fecha: Date }) => {
  const { centroId, fecha } = payload;
  const dieCentro = new DieCentroOrm();
  dieCentro.centroId = centroId;
  dieCentro.fecha = fecha;
  return dieCentro;
};

export const dietaJornadaFactory = (payload: {
  dietaCentroId: number;
  centroId: number;
  jornada: JornadaType;
  horarioId: number;
  fecha: Date;
}) => {
  const { dietaCentroId, fecha, horarioId } = payload;
  const dieJornada = new DieJornadaOrm();
  dieJornada.dieCentroId = dietaCentroId;
  dieJornada.fecha = fecha;
  dieJornada.estadoCode = ESTADOS_JORNADA.SOLICITADA.getCode();
  dieJornada.horarioId = horarioId;
  return dieJornada;
};

export const dietaSubgrupoFactory = (payload: {
  subgrupoActual: SubgrupoOrm;
  dieJornadaId: number;
  userAuthId: number;
}) => {
  const { dieJornadaId, subgrupoActual, userAuthId } = payload;
  const dieSubgrupo = new DieSubgrupoOrm();
  dieSubgrupo.creadoPorId = userAuthId;
  dieSubgrupo.dieJornadaId = dieJornadaId;
  dieSubgrupo.fecha = new Date();
  dieSubgrupo.subGrupoId = subgrupoActual.id;
  return dieSubgrupo;
};

export const dietaEstadoFactory = (payload: {
  dieSubgrupoId: number;
  dieta: DietaDto;
  jornada: JornadaType;
  customDietaEstados: DietaConfExtraOrm[];
  context: GcmContextType;
}) => {
  const { dieSubgrupoId, customDietaEstados, dieta, jornada } = payload;

  const dieEstado = new DieEstadoOrm();

  if (dieta.id) dieEstado.id = dieta.id;
  dieEstado.pacienteId = dieta.pacienteId;
  dieEstado.camaId = dieta.camaId;
  dieEstado.dieSubgrupoId = dieSubgrupoId;
  dieEstado.estadoCode = ESTADOS_DIETA.PENDIENTE.getCode();
  dieEstado.enAislamiento = dieta.enAislamiento;
  dieEstado.combinacionCode = dieta.dietaConfig ? dieta.dietaConfig.trim() : null;
  dieEstado.observacion = dieta.observacion ? dieta.observacion.trim() : dieta.observacion;
  dieEstado.isEliminado = false;

  dieEstado.dietDetails.push(dieEstado.combinacionCode);

  dieEstado.valorDieta = valueForDieta({
    context: payload.context,
    combinacionCode: dieEstado.combinacionCode,
    jornada: payload.jornada,
  });

  if (dieEstado.valorDieta === 0) dieEstado.dietaRecibida = null;
  else dieEstado.dietaRecibida = true;

  if (customDietaEstados && jornada) {
    const customDietaEstado = customDietaEstados.filter(d => d.pacienteId === dieta.pacienteId);
    if (customDietaEstado.length) {
      const config = customDietaEstado[0];
      if (config.isLessThanMaxDays) {
        const keyword = _generateDieExtension(payload.jornada.getCode());
        if (config[`incluyeDietaFamiliar${keyword}`]) {
          dieEstado.combinacionCode = dieEstado.combinacionCode
            ? `${dieEstado.combinacionCode}|`
            : '';
          dieEstado.combinacionCode += DIETAS_EXTRA.DIET_FAMILIAR.getCode();
          dieEstado.dietDetails.push(DIETAS_EXTRA.DIET_FAMILIAR.getCode());
          dieEstado.valorDietaFamiliar = valueForDieta({
            context: payload.context,
            combinacionCode: '',
            jornada: payload.jornada,
            isDietaFamiliar: true,
          });
          dieEstado.dietaFamiliarRecibida = true;
        } else {
          dieEstado.valorDietaFamiliar = 0;
          dieEstado.dietaFamiliarRecibida = null;
        }

        if (config[`incluyeMerienda${keyword}`]) {
          dieEstado.combinacionCode = dieEstado.combinacionCode
            ? `${dieEstado.combinacionCode}|`
            : '';
          if (config.tipoMerienda.includes('HIPOGLUCIDA')) {
            dieEstado.combinacionCode += DIETAS_EXTRA.MERI_HIPOGLUCIDA.getCode();
            dieEstado.dietDetails.push(DIETAS_EXTRA.MERI_HIPOGLUCIDA.getCode());
          } else {
            dieEstado.combinacionCode += DIETAS_EXTRA.MERI_NORMAL.getCode();
            dieEstado.dietDetails.push(DIETAS_EXTRA.MERI_NORMAL.getCode());
          }
          dieEstado.valorMerienda = valueForDieta({
            context: payload.context,
            combinacionCode: '',
            jornada: payload.jornada,
            isMerienda: true,
          });
          dieEstado.meriendaRecibida = true;
        } else {
          dieEstado.valorMerienda = 0;
          dieEstado.meriendaRecibida = null;
        }
      }
    }
  }

  return dieEstado;
};

const _generateDieExtension = (jornadaCode: JornadaCode) => {
  return jornadaCode === JORNADAS_DIETA.DESAYUNO.getCode()
    ? 'Desayuno'
    : jornadaCode === JORNADAS_DIETA.ALMUERZO.getCode()
      ? 'Almuerzo'
      : 'Cena';
};

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

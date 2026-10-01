import { GcmContexts } from '@common/application/constants';
import {
  EstadosCama,
  estadosCamasForHumans,
  TIPO_CAMAS,
  tipoCamaFactory,
} from '../../application/constants';
import {
  CamaDto,
  CamaOcupadaDto,
  EstadisticasCamaDto,
  EstadosCamaDto,
  TipoCamaDto,
} from '../../application/dtos';
import { CamaOcupadaResponse, CamaResponse, CamasResponse } from '../responses';
import { MOTIVOS_BLOQUEO } from '@hpn/old/types/motivo-bloqueo';
const camaDtoEmpty = (): CamaDto => ({
  id: 0,
  codigo: '',
  estado: { codigo: 0, nombre: '' },
  centro: { id: 0, nombre: '', contexto: '' },
  habitacion: { numero: '' },
  prealta: false,
  grupo: { id: 0, codigo: '', nombre: '' },
  subgrupo: { id: 0, codigo: '', nombre: '' },
  tipoCama: TIPO_CAMAS.NINGUNO,
});

export const transformCamaResponseToCamaDto = (
  cama: CamaResponse[],
  ctx: GcmContexts
): CamaDto[] => {
  const camas = cama.map(r => {
    const cama: any = {};
    cama.id = r.OID;
    cama.codigo = r.HCACODIGO;
    if (
      r.HCAESTADO === EstadosCama.BLOQUEADA &&
      r.HCABLOPOR === MOTIVOS_BLOQUEO.RESERVA.getCode()
    ) {
      cama.estado = { codigo: 7, nombre: 'RESERVADA' };
    } else if (r.HCAESTADO === EstadosCama.BLOQUEADA) {
      cama.estado = { codigo: 3, nombre: 'BLOQUEADA' };
    } else {
      cama.estado = { codigo: r.HCAESTADO, nombre: estadosCamasForHumans(r.HCAESTADO) };
    }

    if ([EstadosCama.OCUPADA, EstadosCama.RESERVADA].includes(r.HCAESTADO)) {
      cama.paciente = {
        id: r.OID_PACIENTE,
        nombre: r.GPANOMCOM,
        cedula: r.PACNUMDOC,
        eps: r.GDENOMBRE,
        consecutivo: r.AINCONSEC,
        fechaIngreso: r.AINFECING,
        sexo: r.SEXPAC,
        fechaNacimiento: r.GPAFECNAC,
        diagnostico: r.DIAGNOSTICO,
      };
    }
    cama.centro = { id: r.ADNCENATE, nombre: r.ACANOMBRE.trim(), contexto: ctx };
    cama.prealta = r.ACTIVOPREALTA;
    cama.habitacion = { numero: r.HCANUMHABI.trim() };
    cama.grupo = { id: r.HPNGRUPOS, codigo: r.HGRCODIGO.trim(), nombre: r.HGRNOMBRE.trim() };
    cama.subgrupo = { id: r.HPNSUBGRU, codigo: r.HSUCODIGO.trim(), nombre: r.HSUNOMBRE.trim() };
    cama.tipoCama = tipoCamaFactory(r.HPNTIPOCA);
    return cama;
  });

  return camas;
};
const datosVaciosEstadoCama = (): EstadosCamaDto => ({
  total: 0,
  tipoCamas: datosVaciosTipoCama(),
});

const datosVaciosCentro = (nombre: string): EstadisticasCamaDto => ({
  nombre,
  ocupadas: datosVaciosEstadoCama(),
  desocupadas: datosVaciosEstadoCama(),
  alistamiento: datosVaciosEstadoCama(),
  bloqueadas: 0,
  reservadas: 0,
  inactivas: datosVaciosEstadoCama(),
});

const datosVaciosTipoCama = (): TipoCamaDto => ({
  camas: 0,
  camillas: 0,
  cunas: 0,
  incubadora: 0,
  sillonesexc: 0,
  camillaexc: 0,
  bipersonal: 0,
  trescamasomas: 0,
  unipersonal: 0,
  sillones: 0,
  cama: 0,
  incubadoras: 0,
  cuna: 0,
});

const isCamaReservada = (item: CamasResponse): boolean => {
  return (
    item.HCAESTADO === EstadosCama.BLOQUEADA && item.HCABLOPOR === MOTIVOS_BLOQUEO.RESERVA.getCode()
  );
};

const actualizarEstadosCama = (estadoCama: EstadosCamaDto, tipoCama: string): void => {
  estadoCama.total += 1;
  const tipoCamaLowerCase = tipoCama.replace(/\s+/g, '').toLocaleLowerCase();
  estadoCama.tipoCamas[tipoCamaLowerCase] += 1;
};
export function transformEstadisticas(data: CamasResponse[]) {
  const centroMap = new Map<string, EstadisticasCamaDto>();

  data.forEach(item => {
    const nombreCentro = item.ACANOMBRE.trim().toUpperCase();
    if (!centroMap.has(nombreCentro)) {
      centroMap.set(nombreCentro, datosVaciosCentro(nombreCentro));
    }

    const centro = centroMap.get(nombreCentro);

    switch (item.HCAESTADO) {
      case EstadosCama.OCUPADA:
        actualizarEstadosCama(centro.ocupadas, item.TIPO_CAMA);
        break;
      case EstadosCama.DESOCUPADA:
        actualizarEstadosCama(centro.desocupadas, item.TIPO_CAMA);
        break;
      case EstadosCama.ALISTAMIENTO:
        actualizarEstadosCama(centro.alistamiento, item.TIPO_CAMA);
        break;
      case EstadosCama.BLOQUEADA:
        centro.bloqueadas += 1;
        if (isCamaReservada(item)) {
          centro.reservadas += 1;
        }
        break;
      case EstadosCama.RESERVADA:
        centro.reservadas += 1;
        break;
      case EstadosCama.INACTIVA:
        actualizarEstadosCama(centro.inactivas, item.TIPO_CAMA);
        break;
    }
  });

  const resultado: EstadisticasCamaDto[] = Array.from(centroMap.values()).map(centro => ({
    nombre: centro.nombre,
    ocupadas: {
      total: centro.ocupadas.total,
      tipoCamas: { ...centro.ocupadas.tipoCamas },
    },
    desocupadas: {
      total: centro.desocupadas.total,
      tipoCamas: { ...centro.desocupadas.tipoCamas },
    },
    alistamiento: {
      total: centro.alistamiento.total,
      tipoCamas: { ...centro.alistamiento.tipoCamas },
    },
    bloqueadas: centro.bloqueadas,
    reservadas: centro.reservadas,
    inactivas: centro.inactivas,
  }));

  return resultado;
}

export const transformCamaOcupada = (result: CamaOcupadaResponse[]): CamaOcupadaDto => {
  let response: CamaOcupadaDto = {
    nombre: '',
    cedula: '',
    fecha: undefined,
    eps: '',
    consecutivo: 0,
  };

  result.forEach(item => {
    const newResponnse = {
      nombre: item.GPANOMCOM,
      cedula: item.PACNUMDOC,
      fecha: item.AINFECING,
      eps: item.GDENOMBRE,
      consecutivo: item.AINCONSEC,
    };
    response = newResponnse;
  });

  return response;
};

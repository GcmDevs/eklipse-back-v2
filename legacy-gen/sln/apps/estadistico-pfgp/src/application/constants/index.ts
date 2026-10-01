import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';
import { AgrupadorOrm } from '@sln/pfgp/infrastructure/orm';

export const generateFakeAgrupador = () => {
  const fakeAgrupador = new AgrupadorOrm();
  fakeAgrupador.id = 1;
  fakeAgrupador.nombre = 'EVENTOS';
  fakeAgrupador.peso = 1;
  fakeAgrupador.agrupadorId = 99;
  return fakeAgrupador;
};

const CONTRATOS_ALTACENTRO = (_fecha: Date) => {
  return ['8018', '8019', '8020', '8021', '8022', '8023', '8027', '8028'];
};

const CONTRATOS_VALLEDUPAR = (_fecha: Date) => {
  return ['I202', '8000'];
};

const CONTRATOS_AGUACHICA = (_fecha: Date) => {
  return ['8000', '8001', '8002', '8003', '8004', '8005', '8006'];
};

const CONTRATOS_SANJUAN = (_fecha: Date) => {
  return ['80032'];
};

export const CONTRATOS_PFGP = (context: GcmContextType, fechaInicio: Date) => {
  switch (context) {
    case GCM_CONTEXTS.ALTACENTRO:
      return CONTRATOS_ALTACENTRO(fechaInicio);
    case GCM_CONTEXTS.AGUACHICA:
      return CONTRATOS_AGUACHICA(fechaInicio);
    case GCM_CONTEXTS.SANJUAN:
      return CONTRATOS_SANJUAN(fechaInicio);
    case GCM_CONTEXTS.VALLEDUPAR:
      return CONTRATOS_VALLEDUPAR(fechaInicio);
  }
};

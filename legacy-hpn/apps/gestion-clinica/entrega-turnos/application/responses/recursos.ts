import { ETRegistroClinicoOrm } from '@orm/gcn';
import { EstadoTypeCode } from '../types';

export class dataRes {
  pacientes: ATPacienteHpnRes[];
  entregaTurnoPorSubgrupoActual: EntergaTurnoSubgrupoRes;
  temporalesConfigurados?: boolean;
}

interface UsuarioReponse {
  cedula?: string;
  nombreCompleto?: string;
}

export class ATRegistroClinicoRes {
  id: number;
  turnoId: number;
  isUpdateRegistro: boolean;
  diagnostico: string;
  especialidadTratante: string;
  fechaRegistro: Date;
  pendientes: string;
  reporteImg: string;
  reporteLab: string;
  tratamiento: string;
  subgrupo: { codigo?: string; nombre?: string };
  usuarioMedicoGuarda: UsuarioReponse;
  turno: {
    fechaInicio: Date | null;
    fechaFin: Date | null;
    medicoEntrega: UsuarioReponse | null;
    medicoRecibe: UsuarioReponse | null;
    habilitador: UsuarioReponse | null;
  };
}

export class EntergaTurnoSubgrupoRes {
  id: number;
  subgrupo: EntidadRes;
  fechaEntrega: Date;
  fechaRecibe: Date;
  medicoRecibe: EntidadRes;
  medicoEntrega: EntidadRes;
  estadoCode: EstadoTypeCode;
  isActivo: boolean;
  isUsuarioAsignado: boolean;
}

export class ATPacienteHpnRes {
  id: number;
  numeroDocumento: string;
  nombreCompleto: string;
  fechaNacimiento: Date;
  fechaIngreso: Date;
  ingreso: { id: number; consecutivo: string };
  cama: EntidadRes;
  eps: EntidadRes;
  entregaTurno: EntregaTurnoRes[] | null;
  evolucion: string;
  esTemporal?: boolean;
  asignacionTemporalId?: number;
  subgrupoTemporal?: EntidadRes;
  subgrupoAsignado?: EntidadRes;
  especialidadesTratantes: string[];
}
export class EntregaTurnoRes {
  id: number;
  pacienteId: number;
  medicoEntrega: EntidadRes;
  medicoRecibe: EntidadRes;
  fechaEntrega: Date;
  fechaRecibe: Date;
  datoClinico: ETRegistroClinicoOrm;
  subgrupo: EntidadRes;
  isActivo: boolean;
}

export class EntidadRes {
  id: string;
  codigo: string;
  nombre: string;
}

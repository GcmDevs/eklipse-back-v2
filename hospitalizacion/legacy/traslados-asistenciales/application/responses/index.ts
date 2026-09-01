import { GcmContextType } from '@common/domain/types';
import { TipoTrasladoItemTypeCode, TipoTrasladoTypeCode } from '@hpn/lgc/tas/types/gcn';
import {
  AsistenciaTipoCode,
  CodigoCupsTypeCode,
  EstadoAsistenciaTypeCode,
  EstadoPacienteCode,
  TipoRemisionTypeCode,
} from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';
import { TipoDocumentoCode } from '@hpn/lgc/tas/types/gen';
import {
  MedicamentoOrm,
  TrasladoEstadoHistorialOrm,
  TrasladoRevisionCentralOrm,
} from '@hpn/lgc/tas/orm/gcn';
export * from './retorno-redondo.result';

export class TDiagnosticoRes {
  fechaFolio: Date;
  diagnostico: {
    codigo: string;
    nombre: string;
  };
  medico: {
    nombre: string;
    documento: string;
  };
  observacion: string;
}

export class DataRes {
  id: number;
  codigo: string;
  nombre: string;
}

export class UbicacionDataRes {
  ekid: number;
  id: number;
  codigo: string;
  nombre: string;
  direccion: string;
  departamento: DataRes;
  municipio: DataRes;
}

export class PacienteDataRes {
  id: number;
  ingreso: {
    consecutivo: string;
  };
  nombres: string;
  apellidos: string;
  fechaNacimiento: Date;
  edad: number;
  generoCode: number;
  afiliacionContrato: DataRes;
  soat: string;
  arl: DataRes;
  documento: {
    numero: string;
    tipoCode: TipoDocumentoCode;
  };
  cama?: {
    codigo: string;
    nombre: string;
    subgrupo: {
      codigo: string;
      nombre: string;
    };
  };
  diagnosticos: TDiagnosticoRes[];
}

export class TrasladoAsistencialDataRes {
  codigo: string;
  contexto: GcmContextType;
  id: number;
  cupsCode: CodigoCupsTypeCode;
  paciente: PacienteDataRes;
  origen: UbicacionDataRes;
  destino: UbicacionDataRes;
  tipoCode: AsistenciaTipoCode;
  estadoCode: EstadoAsistenciaTypeCode;
  fechaCreacion: Date;
  fechaHoraProgramada: Date;
  tipoRemisionCode: TipoRemisionTypeCode;
  otroTipoRemision?: string;
  tipoRecorridoCode: TipoTrasladoTypeCode;
  tipoTrasladoCode: TipoTrasladoItemTypeCode | null;
  servicioRequerido: {
    id: number;
    nombre: string;
  } | null;
  usuario: {
    id: number;
    nombre: string;
    documento: string;
  };
  vehiculo: {
    id: number;
    placa: string;
  };
  estadoPacienteCode: EstadoPacienteCode | null;

  tramos?: TramosRes[];
}

export class SignoVitalItemDataRes {
  signo: {
    code: number;
    forHumans: string;
  };
  cantidad: string | number;
}

export class SignosVitalesDetalleDataRes {
  id: number;
  usuario: {
    nombre: string;
    documento: string;
  };
  fechaCreacion: Date;
  observacion: string;
  item: {
    ta?: SignoVitalItemDataRes;
    fc?: SignoVitalItemDataRes;
    fr?: SignoVitalItemDataRes;
    sato2?: SignoVitalItemDataRes;
    fcf?: SignoVitalItemDataRes;
    glasgow?: SignoVitalItemDataRes;
    temp?: SignoVitalItemDataRes;
    talla?: SignoVitalItemDataRes;
    peso?: SignoVitalItemDataRes;
  };
}

export class ProcedimientoDataRes {
  id: number;
  nombre: string;
  codigo: string;
  isTemporal: boolean;
}

export class TramoDetalleDataRes {
  id: number;
  orden: number;
  tipoTramoCode: number;
  estadoCode: number;
  kmFinal: number;
  recibidoPorNombre: string;
  recibidoPorDocumento: string;
  firmaImg: string;
  isActivo: boolean;
  horaInicioRecorrido: Date | null;
  horaSolicitud: Date | null;
  horaDespacho: Date | null;
  horaLlegadaEscena: Date | null;
  horaSalidaEscena: Date | null;
  horaLlegadaInst: Date | null;
  horaRecepcionInst: Date | null;
  horasEspera: string | null;
  descripcionEspera: string | null;
  kmDesviacion: number | null;
  tiempoUtilizado: string | null;
  causaDesviacion: string | null;
  ingresoIps: boolean | null;
  nombreIps: string | null;
  origen: UbicacionDataRes;
  destino: UbicacionDataRes;
  signosVitales: SignosVitalesDetalleDataRes[];
  notas: any[];
  procedimientos: ProcedimientoDataRes[];
  medicamentos: MedicamentoOrm[];
  [key: string]: any;
}

export class TrasladoAsistencialDetalleDataRes extends TrasladoAsistencialDataRes {
  asignacionActual: any;
  asignaciones: any[];
  tramos: TramoDetalleDataRes[];
  estadosHistorial: TrasladoEstadoHistorialOrm[];
  revisionesCentral: TrasladoRevisionCentralOrm[];
  [key: string]: any;
}

export class FilesTrasladoDataRes {
  nombre: string;
  descripcion: string;
}

export class TramosRes {
  id: number;
  tipoTramoCode: number;
  isActivo: boolean;
  horaInicioRecorrido: Date | null;
  horaLlegadaEscena: Date | null;
  horaSalidaEscena: Date | null;
  horaLlegadaInst: Date | null;
  horaRecepcionInst: Date | null;
  estadoCode: number;
}

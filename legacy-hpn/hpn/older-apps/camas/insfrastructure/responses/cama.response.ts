import { TipoIngresoCode } from '@hpn/old/types/general';
import { ClaseIngreso, EstadoOrderServicio, TipoCamas } from '../../application/constants';
import { EstadoIngresoCode } from '@hpn/old/types/estado-ingreso';
import { TipoOrdenHospiCode } from '@hpn/old/types/tipo-orden-hospi';

export interface CamaResponse {
  OID: number;
  ADNCENATE: number;
  ACANOMBRE: string;
  HPNTIPOCA: TipoCamas;
  HTINOMBRE: string;
  HCACODIGO: string;
  HCAESTADO: number;
  HCANOMBRE: string;
  HCANUMHABI: string;
  HPNGRUPOS: number;
  HCABLOPOR: number;
  HGRCODIGO: string;
  HGRNOMBRE: string;
  HPNSUBGRU: number;
  HSUCODIGO: string;
  HSUNOMBRE: string;
  GPANOMCOM: string;
  DIAGNOSTICO: string | null;
  SEXPAC: string;
  GPASEXPAC: number;
  GPAFECNAC: Date;
  OID_PACIENTE: number;
  // HCANOMBRE: string;
  PACNUMDOC: string;
  AINCONSEC: number;
  AINFECING: Date;
  GDENOMBRE: string;
  ACTIVOPREALTA: number | null;
  FECHAPREALTA: Date | null;
  MOTIVOPREALTA: number | null;
  PREALTADADAPOR: string | null;
}

export interface CamasResponse {
  OID: number;
  ADNCENATE: number;
  ACANOMBRE: string;
  HPNTIPOCA: number;
  TIPO_CAMA: string;
  HCACODIGO: string;
  HCAESTADO: number;
  ESTADO_CAMA: string;
  HCANOMBRE: string;
  HCANUMHABI: string;
  HPNGRUPOS: number;
  HGRCODIGO: string;
  HGRNOMBRE: string;
  HPNSUBGRU: number;
  HSUCODIGO: string;
  HSUNOMBRE: string;
  HCABLOPOR: number;
}

export interface CamaOcupadaResponse {
  HCACODIGO: string;
  GPANOMCOM: string;
  HCANOMBRE: string;
  PACNUMDOC: string;
  AINCONSEC: number;
  AINFECING: Date;
  GDENOMBRE: string;
}

export interface ExamenesResponse {
  CONSECUTIVO: number;
  ORDENSERVICIO: number;
  FECHACONFIRMACION: Date;
  FECHASERVICIO: Date;
  SERVICIOCODIGO: string;
  SERVICIONOMBRE: string;
  SUBGRUPONOMBRE: string;
  SUBGRUPOCODIGO: string;
  RESULTADOSEXAMENES: number | null;
  PLANNOMBRE: string;
  CANTIDAD: number;
  ESTADO_ORDEN_SERVICIO: EstadoOrderServicio;
  INGRESO_POR: string;
  CLASE_INGRESO: ClaseIngreso;
  APLICADO_A_PX: boolean;
}

export interface MedicamentosResponseQuery {
  TIPO: string;
  INGRESO: number;
  FEC_SOLICITUD: Date;
  HORAS: number;
  SUMINISTRO: string;
  PRODUCTO: string;
  NOMBRE_PRODUCTO: string;
  SOLICITADO: number;
  DEVUELTA: number;
  APLICADA: number;
  PENDIENTE: number;
  ALMACEN_SOLICITADO: string;
  AREA_SOLICITO: string;
  od_INNMSUMPA: number;
  SEDE: string;
  CAMA: string;
  SERVICIO: string;
  IDENTIFICACION: string;
  PACIENTE: string;
}

export interface MedicamentosResponse {
  tipo: string;
  ingreso: number;
  fecSolicitud: Date;
  horas: number;
  suministro: string;
  producto: string;
  nombreProducto: string;
  solicitado: number;
  devuelta: number;
  aplicada: number;
  pendiente: number;
  almacenSolicitado: string;
  areaSolicito: string;
  odInnmsumpa: number;
  sede: string;
  cama: string;
  servicio: string;
  identificacion: string;
  paciente: string;
}

export interface ProcedimientosResponseQuery {
  SIPCODIGO: string;
  SIPNOMBRE: string;
  FECHASOLICITUD: Date;
  ESTADO: string;
  TIPO: 'QUIRURGICO' | 'NO QUIRURGICO' | 'PAQUETE';
  HCSOBSERV: string | null;
  GENMEDICO: number;
  GMENOMCOM: string;
}
export interface ProcedimientosResponse {
  sipCodigo: string;
  sipNombre: string;
  tipo: 'QUIRURGICO' | 'NO QUIRURGICO' | 'PAQUETE';
  observacion: string | null;
  codigoMedico: number;
  nombreMedico: string;
}

export interface ListaEsperaCamaResponseQuery {
  ACANOMBRE: string;
  INGRESO: number;
  FECHA_INGRESO: Date;
  NOMBREPACIENTE: string;
  PACIENTEDOCU: string;
  EDAD: number;
  EPS: string;
  SEXO: string;
  HORAS_DESDE_INGRESO: number;
  CAMA: null | string;
  HSUNOMBRE: null | string;
  TIPO_INGRESO: string;
  TIPO_INGRESO_CODE: TipoIngresoCode;
  ESTADO_INGRESO: string;
  ESTADO_INGRESO_CODE: EstadoIngresoCode;
  ORDEN_HOSP_PENDIENTE: number;
  TIPO_ORDEN_HOSP: string;
  TIPO_ORDEN_HOSP_CODE: TipoOrdenHospiCode;
  DIAGNOSTICO: string | null;
  FECHA_HOSP_PENDIENTE: Date;
  PRIMER_TIPO_ORDEN_HOSP: number;
  PRIMER_ORDEN_HOSP: Date;
  EVO_URG_SI: string | null;
  EVO_HOSP_SI: string | null;
  EVO_UCI_SI: string | null;
  EVO_URG_DESTINO: string | null;
}

export interface ListaEsperaCamaResponse {
  acanombre: string;
  ingreso: number;
  fechaIngreso: Date;
  horasDesdeIngreso: number;
  nombrePaciente: string;
  pacienteDocu: string;
  edad: number;
  eps: string;
  sexo: string;
  cama: null | string;
  hsunombre: null | string;
  tipoIngreso: TipoIngresoCode;
  estadoIngreso: EstadoIngresoCode;
  ordenHospPendiente: number;
  tipoOrdenHosp: TipoOrdenHospiCode;
  fechaHospPendiente: Date;
  diagnostico: string | null;
}

export interface ListaEsperaResponse {
  hospitalizacion: ListaEsperaCamaResponse[];
  referencia: ListaEsperaCamaReferenciaResponse[];
}

export interface ListaEsperaCamaReferenciaResponse {
  consecutivo: number;
  fechaSol: Date;
  estado: string;
  pacienteAceptado: string;
  prioridad: string;
  tipoDocPac: string | null;
  servicioQueremite: string;
  servicioAlqueremite: string;
  numDocumento: string;
  ingreso: number | null;
  nombreCama: string | null;
  fechaIngreso: Date | null;
  ingresoPor: string | null;
  diagnostico: string | null;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  edad: number;
  sexo: 'F' | 'M' | null;
  entiReferencia: string;
  eps: string;
  entnombre: string;
  municipio: string;
  departamento: string;
  medico: string;
  tramite: number;
  motRemi: string;
  motRemi2: string;
  funcionaContesta: string;
  obsSeguimiento: string;
  fecAceptacion: Date | null;
  obsCierre: null;
  especialidad: string;
  fechaTrasladoPac: null;
  cedula: string;
  nombre: string;
}

export interface ListaEsperaReferenciaResponseQuery {
  CONSECUTIVO: number;
  FECHA_SOL: Date;
  ESTADO: string;
  PACIENTE_ACEPTADO: string;
  PRIORIDAD: string;
  TIPO_DOC_PAC: string | null;
  SERVICIO_QUEREMITE: string;
  SERVICIO_ALQUEREMITE: string;
  NUM_DOCUMENTO: string;
  INGRESO: number | null;
  NOMBRE_CAMA: string | null;
  FECHA_INGRESO: Date | null;
  INGRESO_POR: string | null;
  DIAGNOSTICO: string | null;
  PRIMER_NOMBRE: string;
  SEGUNDO_NOMBRE: string;
  PRIMER_APELLIDO: string;
  SEGUNDO_APELLIDO: string;
  EDAD: number;
  SEXO: 'F' | 'M' | null;
  ENTI_REFERENCIA: string;
  EPS: string;
  ENTNOMBRE: string;
  MUNICIPIO: string;
  DEPARTAMENTO: string;
  MEDICO: string;
  TRAMITE: number;
  MOT_REMI: string;
  MOT_REMI2: string;
  FUNCIONA_CONTESTA: string;
  OBS_SEGUIMIENTO: string;
  FEC_ACEPTACION: Date | null;
  OBS_CIERRE: null;
  ESPECIALIDAD: string;
  FECHA_TRASLADO_PAC: null;
  CEDULA: string;
  NOMBRE: string;
}
export interface Listareservaresponse {
  OID_PACIENTE: number;
  ORIGEN: number;
  NOMBRE_PACIENTE: string;
  DOCUMENTO_PACIENTE: string;
  SEXO: string;
  FECHA_CREACION: Date;
  OBSERVACION: null;
  CREADO_POR_ID: number;
  NOMBRE_CREADO_POR: string;
  OBSERVACION_ANULACION: null;
  TIPO_AISLAMIENTO: null;
  CAMA: number;
  NOMBRE_CAMA: string;
  MUNICIPIO: string;
  CONTRATO: string;
  CENTRO: string;
  MOT_REMI: string;
  MOT_REMI2: string;
}

export interface EvolucionesResponse {
  FECHA_FOLIO: Date;
  ESPECIALIDAD_TRATANTE: string;
  SEGUIMIENTO: string;
  AREA_SERVICIO: string;
  ESPECIALIDAD: string;
  CEDULA_MEDICO: string;
  MEDICO: string;
  HCACODIGO: string;
  HSUNOMBRE: string;
  HSUCODIGO: string;
  OID_FOLIO: string;
}

export const CAMPOS_CAC = [
  'TIPDOCUSUARIO',
  'NUMDOCUSUARIO',
  'CODCIE10',
  'IDETIPOTRATAMIENTO',
  'NOMNEOPLASIA',
  'CANPRIORIZADO',
  'INDINCIDENCIA',
  'EDADDX',
  'FECREMMEDICO',
  'FECINGINST',
  'TIPESTUDIODX',
  'MOTSINHISTOPAT',
  'FECMUESTRAHISTO',
  'FECINFORMEHISTO',
  'CODIPSCONFIRM',
  'FEC1RACONSULTA',
  'HISTOTUMORMUESTRA',
  'GRADIFTUMOR',
  'ESTADTUMORSOLIDO',
  'FECESTADIFICACION',
  'MAMAHER2PRETRAT',
  'MAMAFECHER2',
  'MAMARESHER2',
  'COLESTADDUKES',
  'FECESTADIFICACIONDUKES',
  'LINFESTADIFICACION',
  'PROSTESCALAGLEASON',
  'PEDCLASIFRIESGO',
  'PEDFECCLASIFRIESGO',
  'OBJTRATINICIAL',
  'OBJINTERVPERIODO',
  'ANTOTROCANCER',
  'ANTFECDXOTRO',
  'ANTNOMCANCER',
  'ANTCODCIE10',
  'QUIRECIBIOCORTE',
  'QUICANFASES',
  'QUIFASPREFASE',
  'QUIFASINDUCCION',
  'QUIFASINTENSIF',
  'QUIFASCONSOLID',
  'QUIFASREINDUCC',
  'QUIFASMANTENIM',
  'QUIFASMANTLARGO',
  'QUIFASOTRA',
  'QUINUMCICLOSREP',
  'QUIUBITEMP1CICLO',
  'QUIFECINICIO1CICLO',
  'QUINUMIPS1CICLO',
  'QUICODIPS11CICLO',
  'QUICODIPS21CICLO',
  'QUIMEDANTINEOP1CICLO',
  'QUIMEDESPECIF1CICLO',
  'QUIMEDNOPOS1A1CICLO',
  'QUIMEDNOPOS21CICLO',
  'QUIMEDNOPOS31CICLO',
  'QUIRECIBIOINTRATECAL',
  'QUIFECFIN1CICLO',
  'QUICARACACTUAL1CICLO',
  'QUIMOTFINPREM1CICLO',
  'QUIUBITEMPULTCICLO',
  'QUIFECINICIOULTCICLO',
  'QUINUMIPSULTCICLO',
  'QUICODIPS1ULTCICLO',
  'QUICODIPS2ULTCICLO',
  'QUIMEDANTINEOPULTCICLO',
  'QUIMEDESPECIFULTCICLO',
  'QUIMEDNOPOS1AULTCICLO',
  'QUIMEDNOPOS2ULTCICLO',
  'QUIMEDNOPOS3ULTCICLO',
  'QUIRECIBIOINTRATECALULT',
  'QUIFECFINULTCICLO',
  'QUICARACACTUALULTCICLO',
  'QUIMOTFINPREMULTCICLO',
  'CIRSOMETIDOCORTE',
  'CIRNUMCIRUGIAS',
  'CIRFEC1RACIRUGIA',
  'CIRCODIPS11RA',
  'CIRCODIPS21RA',
  'CIRUBITEMP1RA',
  'CIRFECULTCIRUGIA',
  'CIRMOTULTCIRUGIA',
  'CIRCODIPSULT',
  'CIRCODULTCIRUGIA',
  'CIRUBITEMPULT',
  'CIRESTADOVITALULT',
  'RADRECIBIOCORTE',
  'RADNUMESQUEMAS',
  'RADFECINI1ESQ',
  'RADUBITEMP1ESQ',
  'RADTIPRADIO1ESQ',
  'RADNUMIPS1ESQ',
  'RADCODIPS11ESQ',
  'RADCODIPS21ESQ',
  'RADFECFIN1ESQ',
  'RADCARACACTUAL1ESQ',
  'RADMOTFIN1ESQ',
  'RADFECINIULTESQ',
  'RADUBITEMPULTESQ',
  'RADTIPRADIOULTESQ',
  'RADNUMIPSULTESQ',
  'RADCODIPS1ULTESQ',
  'RADCODIPS2ULTESQ',
  'RADFECFINULTESQ',
  'RADCARACACTUALULTESQ',
  'RADMOTFINULTESQ',
  'TRARECIBIOCORTE',
  'TRATIPO',
  'TRAUBITEMPORAL',
  'TRAFECTRASPLANTE',
  'TRACODIPS',
  'TRCRECIBIOCIRRECONS',
  'TRCFECCIRRECONS',
  'TRCCODIPSCIRRECONS',
  'TRCVALCUIDADOPALIATIVO',
  'TRCATENCIONESCUIDADOPAL',
  'TRCFEC1RACONSULTAPAL',
  'TRCCODIPSCUIDADOPAL',
  'TRCVALPSIQUIATRIA',
  'TRCFEC1RACONSULTAPSIQ',
  'TRCCODIPSPSIQUIATRIA',
  'TRCVALNUTRICION',
  'TRCFECCONSULTANUTRICION',
  'TRCCODIPSNUTRICION',
  'TRCRECIBIOSOPORTENUTRI',
  'TRCRECIBIOTERAPIASREHAB',
  'RMORESMANEJOONCO',
  'RMOESTADOVITAL',
  'RMONOVADMINISTRATIVA',
  'RMONOVCLINICA',
  'RMOFECDESAFILIACION',
  'RMOFECMUERTE',
  'RMOCAUSAMUERTE',
] as const;
export type CampoCac = (typeof CAMPOS_CAC)[number];
export type DatosCac = Record<CampoCac, string | null>;
export interface BusquedaCacDto {
  tipoDocumento: number;
  documento: string;
}
export interface GuardarCacDto extends BusquedaCacDto {
  datos: DatosCac;
  version: string | null;
}
export interface RegistroCacResponse {
  datos: DatosCac;
  version: string;
}
export interface ConsultaCacResponse {
  paciente: PacienteCacResponse | null;
  registro: RegistroCacResponse | null;
  diagnosticos: DiagnosticoCacResponse[];
  aviso: string;
}
export interface DiagnosticoCacResponse {
  codigoCie10: string;
  tipoTratamiento: string | null;
}
export interface DiagnosticoOncologicoResponse {
  codigo: string;
  nombre: string;
  tipoCancer: number | null;
}
export interface CatalogoOncologicoResponse {
  diagnosticos: DiagnosticoOncologicoResponse[];
}
export interface PacienteCacResponse {
  id: number;
  tipoDocumento: number;
  documento: string;
  tipoDocumentoDescripcion: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  fechaNacimiento: string | null;
  sexo: string;
  ocupacion: string;
  regimen: string;
  codigoEps: string;
  eps: string;
  grupoPoblacional: string;
  municipio: string;
  codigoMunicipio: string;
  telefono: string;
  fechaAfiliacion: string | null;
  ocupacionId: number | null;
  grupoPoblacionalId: number | null;
  municipioId: number | null;
  departamentoId: number | null;
  detalleContratoId: number | null;
  telefonoId: number | null;
  sexoCodigo: number | null;
  regimenCodigo: number | null;
}
export interface OpcionRecursoCac {
  id: number;
  codigo: string;
  nombre: string;
  padreId?: number;
}
export interface RecursosPacienteCacResponse {
  ocupaciones: OpcionRecursoCac[];
  gruposPoblacionales: OpcionRecursoCac[];
  eps: OpcionRecursoCac[];
  departamentos: OpcionRecursoCac[];
  municipios: OpcionRecursoCac[];
}
export interface ActualizarPacienteCacDto extends BusquedaCacDto {
  primerNombre: string;
  segundoNombre: string | null;
  primerApellido: string;
  segundoApellido: string | null;
  fechaNacimiento: string;
  fechaAfiliacion: string;
  sexoCodigo: number;
  regimenCodigo: number;
  ocupacionId: number;
  grupoPoblacionalId: number;
  municipioId: number;
  detalleContratoId: number;
  telefono: string;
}
export interface ActualizarPacienteCacResponse {
  exitoso: boolean;
  mensaje: string;
  paciente: PacienteCacResponse;
}
export type CrearPacienteCacDto = ActualizarPacienteCacDto;
export type CrearPacienteCacResponse = ActualizarPacienteCacResponse;
export interface GuardadoCacResponse {
  exitoso: boolean;
  mensaje: string;
  registro: RegistroCacResponse;
}

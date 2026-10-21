import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  CodigoCupsTypeCode,
  CondicionClinicaCode,
  EstadoPacienteCode,
  TipoRemisionTypeCode,
  AreaRecogidaTypeCode,
  ClimaTypeCode,
  TipoVehiculoInvolucradoTypeCode,
  AREAS_RECOGIDA_VALUES,
  CLIMAS_VALUES,
  TIPOS_VEHICULO_INVOLUCRADO_VALUES,
} from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';
import {
  MedicamentoDto,
  MedicamentoPrevioDto,
  NotaDto,
  PacienteTemporalDto,
  ProcedimientoItemDto,
  UbicacionDto,
} from './traslado.dto';
import { SignosVitalesFlowDto } from './signos.dto';

export class PacienteTemporalSegmentadoDto extends PacienteTemporalDto {
  @IsNumber()
  @IsIn([0, 1, 2, 3, 4, 5])
  estadoCivilCode: number;

  @IsString()
  @Matches(/\S/)
  @MaxLength(250)
  direccion: string;

  @IsString()
  @Matches(/\S/)
  @MaxLength(150)
  barrio: string;

  @IsString()
  @Matches(/\S/)
  @MaxLength(30)
  celular: string;
}

export class CreatePrimarioSegmentadoDto {
  @IsNumber()
  centroId: number;

  @IsNumber()
  cupsCode: CodigoCupsTypeCode;

  @IsOptional()
  @IsNumber()
  pacienteId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => PacienteTemporalSegmentadoDto)
  pacienteTemporal?: PacienteTemporalSegmentadoDto;

  @IsNumber()
  tipoRemisionCode: TipoRemisionTypeCode;

  @IsOptional()
  @IsString()
  otroTipoRemision?: string;

  @IsString()
  solicitadoEl: string;

  @IsString()
  despachoHora: string;

  @IsString()
  llegadaEscenaHora: string;

  @IsString()
  salidaEscenaHora: string;
}

export class UpdatePrimarioPacienteDto extends CreatePrimarioSegmentadoDto {}

export class UpdatePrimarioUbicacionDto {
  @ValidateNested()
  @Type(() => UbicacionDto)
  origen: UbicacionDto;

  @ValidateNested()
  @Type(() => UbicacionDto)
  destino: UbicacionDto;

  @IsOptional()
  @IsNumber()
  @IsIn(AREAS_RECOGIDA_VALUES.map(item => item.getCode()))
  areaCode?: AreaRecogidaTypeCode;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitudOrigen?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitudOrigen?: number;

  @IsOptional()
  @IsString()
  barrioOrigen?: string;

  @IsOptional()
  @IsString()
  referenciaOrigen?: string;

  @IsOptional()
  @IsString()
  veredaOrigen?: string | null;

  @IsOptional()
  @IsString()
  viaOrigen?: string | null;

  @IsOptional()
  @IsString()
  kilometroOrigen?: string | null;
}

export class UpdatePrimarioDiagnosticoDto {
  @IsNumber()
  diagPrincipalId: number;

  @IsOptional()
  @IsNumber()
  diagSecundarioId?: number | null;

  @IsString()
  hallazgosClinicos: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  triage: number;

  @IsOptional()
  @IsString()
  bodyMapImageName?: string;

  @IsOptional()
  @IsBoolean()
  eliminarMapaCorporal?: boolean;
}

export class SignosVitalesSegmentadoDto extends SignosVitalesFlowDto {}

export class ProcedimientoSegmentadoDto extends ProcedimientoItemDto {}

export class MedicamentoSegmentadoDto extends MedicamentoDto {}

export class NotaSegmentadaDto extends NotaDto {}

export class UpdatePrimarioCondicionDto {
  @IsArray()
  @IsNumber({}, { each: true })
  condicionesClinicas: CondicionClinicaCode[];

  @IsOptional()
  @IsString()
  fechaHoraVistoBienPaciente?: string;

  @IsOptional()
  @IsBoolean()
  prenotificaAlSitio?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicamentoPrevioDto)
  medicamentosPrevios?: MedicamentoPrevioDto[];
}

export class TripulanteSegmentadoDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  nombre: string;

  @IsString()
  documento: string;
}

export class UpdatePrimarioTripulacionDto {
  @IsNumber()
  vehiculoId: number;

  @ValidateNested()
  @Type(() => TripulanteSegmentadoDto)
  conductor: TripulanteSegmentadoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TripulanteSegmentadoDto)
  auxiliar?: TripulanteSegmentadoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TripulanteSegmentadoDto)
  medico?: TripulanteSegmentadoDto | null;

  @IsOptional()
  @IsString()
  acompananteNombre?: string | null;

  @IsOptional()
  @IsString()
  acompananteDocumento?: string | null;

  /*   @IsOptional()
  @IsNumber()
  tipoTrasladoCode?: TipoTrasladoItemTypeCode; */
}

export class UpdatePrimarioAccidenteDto {
  @IsString()
  codigoCrue: string;

  @IsString()
  entidadDespacho: string;

  @IsBoolean()
  escenaSegura: boolean;

  @IsOptional()
  @IsNumber()
  @IsIn(CLIMAS_VALUES.map(item => item.getCode()))
  climaCode?: ClimaTypeCode | null;

  @IsOptional()
  @IsString()
  estadoVia?: string | null;

  @IsOptional()
  @IsString()
  senalizacion?: string | null;

  @IsNumber()
  mecanismoCode: number;

  @IsString()
  quejaPrincipal: string;
}

export class VehiculoInvolucradoDto {
  @IsBoolean()
  fuga: boolean;

  @IsBoolean()
  noIdentificado: boolean;

  @IsOptional()
  @IsString()
  placa?: string;

  @IsNumber()
  @IsIn(TIPOS_VEHICULO_INVOLUCRADO_VALUES.map(item => item.getCode()))
  tipoCode: TipoVehiculoInvolucradoTypeCode;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  conductor?: string;

  @IsOptional()
  @IsString()
  documento?: string;

  @IsOptional()
  @IsString()
  celular?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  barrio?: string;
}

export class UpdatePrimarioEntregaDto {
  @IsNumber()
  servicioRequeridoId: number;

  @IsBoolean()
  pertenenciasEntregadas: boolean;

  @IsString()
  @Matches(/\S/, { message: 'El relato de la entrega es obligatorio' })
  relato: string;

  @IsBoolean()
  custodia: boolean;

  @IsString()
  @IsIn(['paciente', 'familiar'])
  consentimientoOtorgadoPor: 'paciente' | 'familiar';
}

export class EvidenciaMetadataDto {
  @IsString()
  nombre: string;

  @IsIn(['sitio', 'vehiculo'])
  categoria: 'sitio' | 'vehiculo';

  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class UpdatePrimarioEvidenciasDto {
  @IsOptional()
  @IsArray()
  existentes?: Array<{
    nombre: string;
    descripcion?: string;
    categoria: 'sitio' | 'vehiculo';
    ruta?: string;
    tipo?: string;
    tamano?: number;
  }>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvidenciaMetadataDto)
  nuevas?: EvidenciaMetadataDto[];
}

export class FinalizarPrimarioSegmentadoDto {
  @IsOptional()
  @IsString()
  llegadaInstitucionHora?: string;

  @IsOptional()
  @IsString()
  recepcionInstitucionHora?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  kmInicial?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  kmFinal?: number;

  @IsOptional()
  @IsNumber()
  estadoPacienteCode?: EstadoPacienteCode;

  @IsOptional()
  @IsString()
  recibidoPorNombre?: string;

  @IsOptional()
  @IsString()
  recibidoPorDocumento?: string;

  @IsOptional()
  @IsString()
  recibidoPorFirmaImg?: string;
}

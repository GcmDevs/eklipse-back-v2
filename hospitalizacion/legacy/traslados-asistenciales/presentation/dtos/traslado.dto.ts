import { ApiProperty } from '@nestjs/swagger';
import { TipoTrasladoItemTypeCode, TipoTrasladoTypeCode } from '@hpn/lgc/tas/types/gcn';
import { TipoSoporteVitalTypeCode } from '@hpn/lgc/tas/types/gcn/tipo-soperte-vital';
import {
  AsistenciaTipoCode,
  CodigoCupsTypeCode,
  EstadoPacienteCode,
  GrupoSanguineoTypeCode,
  TipoRemisionTypeCode,
  TipoSexoTypeCode,
} from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';
import { TipoDocumentoCode } from '@hpn/lgc/tas/types/gen';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { GcmContextCode } from '@common/domain/types';
import { SignosVitalesFlowDto } from './signos.dto';

export class IniciarRetornoDto {
  @IsNumber()
  trasladoId: number;

  @IsBoolean()
  isEspera: boolean;

  @IsNumber()
  vehiculoId: number;

  @IsNumber()
  @IsOptional()
  horasEspera: number;

  @IsString()
  @IsOptional()
  descripcion: string;

  @ApiProperty({ description: 'Contexto' })
  @IsString()
  contextoCode: GcmContextCode;

  @IsString()
  fechaHoraLlegadaSitio: string;

  @IsString()
  fechaHoraInicioRetorno: string;

  @IsNumber()
  kmInicial: number;
}

export class IniciarTrasladoDto {
  @IsNumber()
  trasladoId: number;

  @IsNumber()
  vehiculoId: number;

  @IsOptional()
  @IsNumber()
  tramoId?: number;

  @IsNumber()
  kmInicial: number;

  @IsString()
  fechaHoraLlegadaSitioRecoger: string;

  @IsString()
  fechaHoraInicio: string;

  @ApiProperty({ description: 'Contexto' })
  @IsString()
  contextoCode: GcmContextCode;
}

export class PacienteTemporalDto {
  @IsString()
  nombre: string;

  @IsString()
  apellido: string;

  @IsNumber()
  tipoDocumentoCode: TipoDocumentoCode;

  @IsString()
  numeroDocumento: string;

  @IsNumber()
  generoCode: TipoSexoTypeCode;

  @IsNumber()
  edad: number;

  @IsString()
  eps: string;

  @IsString()
  arl: string;

  @IsNumber()
  grupoSanguineoCode: GrupoSanguineoTypeCode;

  @IsString()
  soat: string;
}

export class UbicacionDto {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  direccion: string;

  @IsOptional()
  @IsNumber()
  departamentoId: number;

  @IsOptional()
  @IsNumber()
  municipioId: number;
}

export class ProcedimientoItemDto {
  @IsNumber()
  id: number;

  @IsBoolean()
  isTemporal: boolean;

  @IsString()
  fechaHoraRegistro: string;
}

export class CreateTrasladoSecundarioDto {
  @ApiProperty({ description: 'ID del centro' })
  @IsNumber()
  centroId: number;

  @ApiProperty({ description: 'ID del paciente' })
  @IsNumber()
  pacienteId: number;

  @IsNumber()
  cupsCode: CodigoCupsTypeCode;

  @IsNumber()
  tipoCode: AsistenciaTipoCode;

  @ValidateNested()
  @Type(() => UbicacionDto)
  origen: UbicacionDto;

  @ValidateNested()
  @Type(() => UbicacionDto)
  destino: UbicacionDto;

  @IsNumber()
  servicioRequeridoId: number;

  @IsNumber()
  tipoRecorridoCode: TipoTrasladoTypeCode;

  @IsNumber()
  tipoTrasladoCode: TipoTrasladoItemTypeCode;

  @IsNumber()
  tipoRemisionCode: TipoRemisionTypeCode;

  /*  @IsOptional() */
  @IsString()
  otroTipoRemision: string;

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => TipoSoporteVitalDto)
  tipoSoportesVitales: TipoSoporteVitalDto[];

  @IsOptional()
  @IsString()
  otroSoporteVital: string;

  @IsOptional()
  @IsString()
  observacion: string;

  @IsString()
  fechaHoraProgramada: string;
}

class TipoSoporteVitalDto {
  @IsNumber()
  code: TipoSoporteVitalTypeCode;
}

class EkEmpleadoOrUsuarioDto {
  @IsNumber()
  @IsOptional()
  id: number;

  @IsString()
  nombre: string;

  @IsString()
  documento: string;
}

export class CreateTrasladoPrimarioDto {
  @ApiProperty({ description: 'ID del centro' })
  @IsNumber()
  centroId: number;

  @ApiProperty({ description: 'Kilometraje inicial' })
  @IsNumber()
  kmInicial: number;

  @ApiProperty({ description: 'Kilometraje final' })
  @IsNumber()
  kmFinal: number;

  @ApiProperty({ description: 'ID del paciente (opcional)', required: false })
  @IsOptional()
  @IsNumber()
  pacienteId: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => PacienteTemporalDto)
  pacienteTemporal: PacienteTemporalDto;

  @IsNumber()
  cupsCode: CodigoCupsTypeCode;

  @ValidateNested()
  @Type(() => UbicacionDto)
  origen: UbicacionDto;

  @ValidateNested()
  @Type(() => UbicacionDto)
  destino: UbicacionDto;

  @IsNumber()
  tipoRemisionCode: TipoRemisionTypeCode;

  @IsOptional()
  @IsString()
  otroTipoRemision: string;

  @IsOptional()
  @IsNumber()
  diagPrincipalId: number;

  @IsOptional()
  @IsNumber()
  diagSecundarioId: number;

  @IsString()
  hallazgosClinicos: string;

  @IsString()
  bodyMapImageName: string;

  @IsNumber()
  estadoPacienteCode: EstadoPacienteCode;

  @ValidateNested()
  @Type(() => SignosVitalesFlowDto)
  signosVitales: SignosVitalesFlowDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcedimientoItemDto)
  procedimientos?: ProcedimientoItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicamentoDto)
  medicamentos?: MedicamentoDto[];

  @IsNumber()
  vehiculoId: number;

  @ValidateNested()
  @Type(() => EkEmpleadoOrUsuarioDto)
  conductor: EkEmpleadoOrUsuarioDto;

  @ValidateNested()
  @Type(() => EkEmpleadoOrUsuarioDto)
  auxiliar: EkEmpleadoOrUsuarioDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EkEmpleadoOrUsuarioDto)
  medico: EkEmpleadoOrUsuarioDto;

  @IsOptional()
  @IsString()
  acompananteNombre?: string;

  @IsOptional()
  @IsString()
  acompananteNumero?: string;

  @IsString()
  solicitadoEl: string;

  @IsString()
  llegadaEscenaHora: string;

  @IsString()
  despachoHora: string;

  @IsString()
  salidaEscenaHora: string;

  @IsString()
  llegadaInstitucionHora: string;

  @IsString()
  recepcionInstitucionHora: string;

  @IsString()
  recibidoPorNombre: string;

  @IsString()
  recibidoPorDocumento: string;

  @IsString()
  recibidoPorFirmaImg: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotaDto)
  notas?: NotaDto[];

  /*  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EkImagenesDto)
  archivosAdjuntos?: EkImagenesDto[]; */
}

export class AsignarTrasladoDto {
  @IsString()
  contextoCode: GcmContextCode;

  @IsNumber()
  trasladoId: number;

  @IsOptional()
  @IsNumber()
  tramoId?: number;

  @IsNumber()
  vehiculoId: number;

  @ValidateNested()
  @Type(() => EkEmpleadoOrUsuarioDto)
  conductor: EkEmpleadoOrUsuarioDto;

  @ValidateNested()
  @Type(() => EkEmpleadoOrUsuarioDto)
  auxiliar: EkEmpleadoOrUsuarioDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EkEmpleadoOrUsuarioDto)
  medico: EkEmpleadoOrUsuarioDto;

  @IsOptional()
  @IsString()
  motivo?: string;
}

export class ReasignarTrasladoDto extends AsignarTrasladoDto {}

export class EntregaMovilDto {
  @IsNumber()
  trasladoId: number;

  @IsNumber()
  vehiculoId: number;

  @IsString()
  observacion: string;

  @ValidateNested()
  @Type(() => SignosVitalesFlowDto)
  signosVitales: SignosVitalesFlowDto;

  @ApiProperty({ description: 'Contexto' })
  @IsString()
  contextoCode: GcmContextCode;
}

export class RecibirTripulacionDto extends EntregaMovilDto {}

export class NotaDto {
  @IsString()
  fechaHoraRegistro: string;

  @IsString()
  nota: string;
}

export class MedicamentoDto {
  @IsNumber()
  id: number;

  @IsString()
  dosis: string;

  @IsString()
  via: string;

  @IsString()
  fechaHoraRegistro: string;
}

export class RegistrarComplicacionDto {
  @IsNumber()
  trasladoId: number;

  @IsNumber()
  vehiculoId: number;

  @IsString()
  causa: string;

  @IsString()
  ips: string;

  @IsNumber()
  kmDesviacion: number;

  @IsNumber()
  tiempoUtilizado: number;

  @ApiProperty({ description: 'Contexto' })
  @IsString()
  contextoCode: GcmContextCode;
}

class EkImagenesDto {
  @IsNumber()
  tipoTraslado: number;

  @IsString()
  nombre: string;

  @IsString()
  descripcion: string;
}

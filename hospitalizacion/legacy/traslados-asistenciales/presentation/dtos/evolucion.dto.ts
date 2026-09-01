import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { MedicamentoDto, ProcedimientoItemDto } from './traslado.dto';
import { EstadoPacienteCode } from '@hpn/lgc/tas/types/gcn/traslados-asistenciales/estado-paciente';
import { ApiProperty } from '@nestjs/swagger';
import { GcmContextCode } from '@common/domain/types';
import { SignosVitalesFlowDto } from './signos.dto';

export class CreateSignosVitalesDto {
  @IsNumber()
  trasladoId: number;

  @IsNumber()
  vehiculoId: number;

  @IsOptional()
  @IsNumber()
  tramoId?: number;

  @ValidateNested()
  @Type(() => SignosVitalesFlowDto)
  signosVitales: SignosVitalesFlowDto;

  @IsOptional()
  @IsString()
  observacion?: string;

  @ApiProperty({ description: 'Contexto' })
  @IsString()
  contextoCode: GcmContextCode;
}

export class CreateNotaTrasladoDto {
  @IsNumber()
  trasladoId: number;

  @IsNumber()
  vehiculoId: number;

  @IsString()
  nota: string;

  @ApiProperty({ description: 'Contexto' })
  @IsString()
  contextoCode: GcmContextCode;

  @ApiProperty({ description: 'Fecha Hora Registro' })
  @IsString()
  fechaHoraRegistro: string;
}

export class CreateProcedimientoDto {
  @IsNumber()
  trasladoId: number;

  @IsNumber()
  vehiculoId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcedimientoItemDto)
  procedimientos: ProcedimientoItemDto[];

  @ApiProperty({ description: 'Contexto' })
  @IsString()
  contextoCode: GcmContextCode;
}

export class CreateUltimaVeZVistoBienDto {
  @IsNumber()
  trasladoId: number;

  @IsNumber()
  vehiculoId: number;

  @IsString()
  fechaHoraVistoBienPaciente: Date;

  @ApiProperty({ description: 'Contexto' })
  @IsString()
  contextoCode: GcmContextCode;
}

export class CreateMedicamentoDto {
  @IsNumber()
  trasladoId: number;

  @IsNumber()
  vehiculoId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicamentoDto)
  medicamentos: MedicamentoDto[];

  @ApiProperty({ description: 'Contexto' })
  @IsString()
  contextoCode: GcmContextCode;
}

export class FinalizarTrasladoEvolucionDto {
  @IsNumber()
  trasladoId: number;

  @IsNumber()
  vehiculoId: number;

  @IsNumber()
  kmFinal: number;

  @IsString()
  fechaHoraLlegadaInst: string;

  @IsString()
  fechaHoraRecepcionInst: string;

  @IsString()
  recibidoPorDocumento: string;

  @IsString()
  recibidoPorNombre: string;

  @IsString()
  recibidoPorFirmaImg: string;

  @IsNumber()
  estadoPacienteCode: EstadoPacienteCode;

  @ApiProperty({ description: 'Contexto' })
  @IsString()
  contextoCode: GcmContextCode;
}

export class CreateProcedimientosListaDto {
  @IsString()
  codigo: string;

  @IsString()
  nombre: string;
}

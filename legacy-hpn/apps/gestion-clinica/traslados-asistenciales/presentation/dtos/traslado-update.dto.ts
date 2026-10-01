import {
  AsistenciaTipoCode,
  CodigoCupsTypeCode,
  TipoRemisionTypeCode,
} from '@ctypes/gcn/traslados-asistenciales';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { UbicacionDto } from './traslado.dto';
import { TipoTrasladoItemTypeCode, TipoTrasladoTypeCode } from '@ctypes/gcn';

export class UpdateTrasladoSecundarioDto {
  @IsNumber()
  trasladoId: number;

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

  /*   @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => TipoSoporteVitalDto)
  tipoSoportesVitales: TipoSoporteVitalDto[]; */

  @IsOptional()
  @IsString()
  otroSoporteVital: string;

  @IsOptional()
  @IsString()
  observacion: string;

  @IsString()
  fechaHoraProgramada: string;
}

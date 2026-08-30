import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { castDataServices } from '@common/application/services';
import { PrioridadCode, TipoCode } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import {
  IsNumber,
  IsArray,
  ValidateNested,
  IsString,
  IsOptional,
  MaxLength,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { GcmContexts } from '@common/domain/types';

export class DetalleSolicitudDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  id?: number;
  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isDeleted?: boolean;
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  productoId?: number;
  @ApiProperty()
  @IsNumber()
  tipoCode?: TipoCode;
  @ApiProperty()
  @IsNumber()
  cantidad: number;
  @ApiProperty()
  @IsString()
  nombre: string;
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  @IsOptional()
  marca: string;
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  @IsOptional()
  fichaTecnicaFileName: string;
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  @IsOptional()
  formatoInclusionFileName: string;
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  descripcion: string;
}

export class ManageSolicitudDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  id?: number;
  @ApiProperty()
  @IsNumber()
  centroId: number;
  @ApiProperty()
  @IsNumber()
  dependenciaOrigenId: number;
  @ApiProperty()
  @IsNumber()
  dependenciaDestinoId: number;
  @ApiProperty()
  @IsNumber()
  tipoCode: TipoCode;
  @ApiProperty()
  @IsNumber()
  prioridadCode: PrioridadCode;
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  valorEstimado: number;
  @ApiProperty({ type: DetalleSolicitudDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleSolicitudDto)
  detalle: DetalleSolicitudDto[];
  @ApiProperty()
  @IsString()
  @IsOptional()
  justificacion?: string;
}

export class UpdateSolicitudColaboradorDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GcmContexts, { message: `${castDataServices.enumToString(GcmContexts)}` })
  contextCode: GcmContexts;
  @ApiProperty()
  @IsNumber()
  solicitudId: number;
  @ApiProperty()
  @IsBoolean()
  isAprobado: boolean;
  @ApiProperty()
  @IsOptional()
  @IsString()
  observaciones: string;
}

export class CancelarSolicitudDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GcmContexts, { message: `${castDataServices.enumToString(GcmContexts)}` })
  contextCode: GcmContexts;
  @ApiProperty()
  @IsNumber()
  solicitudId: number;
  @ApiProperty()
  @IsBoolean()
  isAprobado: boolean;
  @ApiProperty()
  @IsOptional()
  @IsString()
  observaciones: string;
}

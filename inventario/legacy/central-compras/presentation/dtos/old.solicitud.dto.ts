import { GcmContexts } from '@common/domain/types';
import { castDataServices } from '@common/application/services';
import { PrioridadCode, TipoCode } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { Type } from 'class-transformer';
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

export class OldDetalleSolicitudDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsBoolean()
  @IsOptional()
  isDeleted?: boolean;

  @IsNumber()
  @IsOptional()
  productoId?: number;

  @IsNumber()
  tipo?: TipoCode;

  @IsNumber()
  cantidad: number;

  @IsString()
  nombre: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  marca: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  ftFileName: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  fiFileName: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  descripcion: string;
}

export class OldManageSolicitudDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  centroId: number;

  @IsNumber()
  dependenciaId: number;

  @IsNumber()
  dependenciaDestinoId: number;

  @IsNumber()
  tipo: TipoCode;

  @IsNumber()
  prioridad: PrioridadCode;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OldDetalleSolicitudDto)
  detalle: OldDetalleSolicitudDto[];

  @IsString()
  @IsOptional()
  justificacion?: string;
}

export class OldCambiarEstadoSolicitudColaboradorDto {
  @IsNotEmpty()
  @IsEnum(GcmContexts, { message: `${castDataServices.enumToString(GcmContexts)}` })
  context: GcmContexts;

  @IsNumber()
  solicitudId: number;

  @IsBoolean()
  isAprobado: boolean;

  @IsOptional()
  @IsString()
  observaciones: string;
}

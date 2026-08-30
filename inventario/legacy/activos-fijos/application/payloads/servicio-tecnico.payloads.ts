import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  AfnTipoSerTecCode,
  AfnTipoSolSerTecCode,
  TipoRequerimientoContratoSolSerTecCode,
} from '@inn/lgc/afn/types/inn/activos-fijos';
import { Type } from 'class-transformer';
import { PrioridadCode } from '@inn/lgc/afn/types/gen';

export class ItemSoliSerTecPayload {
  @IsNumber()
  tipoServicioTecnicoCode: AfnTipoSerTecCode;

  @IsNumber()
  tipoMantenimientoCode: AfnTipoSolSerTecCode;

  @IsNumber()
  activoId: number;

  @IsString()
  @MaxLength(300)
  observacion: string;

  @IsBoolean()
  @IsOptional()
  isFallaInUsoClinico: boolean;

  @IsBoolean()
  @IsOptional()
  isPacienteLesionadoByEquipo: boolean;

  @IsDate()
  @IsOptional()
  fechaLimReq: Date;

  @IsNumber()
  @IsOptional()
  tipoRequerimientoContratoCode: TipoRequerimientoContratoSolSerTecCode;

  @IsNumber()
  @IsOptional()
  ingresoId: number;
}

export class CreateSoliSerTecPayload {
  @IsNumber()
  prioridadCode: PrioridadCode;

  @IsNumber()
  centroId: number;

  @IsNumber()
  dependenciaId: number;

  @IsString()
  @MaxLength(100)
  ubicacion: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemSoliSerTecPayload)
  detalle: ItemSoliSerTecPayload[];

  @IsString()
  @MaxLength(50)
  @IsOptional()
  f1FileName: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  f2FileName: string;
}

export class CreateNotaSerTecPayload {
  @IsNumber()
  @IsOptional()
  notaId: number;

  @IsNumber()
  itemSolicitudId: number;

  @IsString()
  nota: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  f1FileName: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  f2FileName: string;

  isAprobado: boolean;
  isEstadoAtencion: boolean;
}
export class RechAproAteSerTecPayload {
  @IsBoolean()
  isAprobado: boolean;

  @IsNumber()
  itemSolicitudId: number;

  @IsString()
  @IsOptional()
  nota: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  f1FileName: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  f2FileName: string;

  isEstadoAtencion: boolean;
}

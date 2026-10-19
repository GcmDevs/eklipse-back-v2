import {
  IsBoolean,
  isNumber,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import {
  SistemaOperativoCode,
  TipoDiscoDuroCode,
  TipoDiscoDuroConectorCode,
  TipoEntradaConectorCode,
} from '../../domain/types';
import { TipoEquipoCode } from '../../domain/types/tipo-equipo';
import { Type } from 'class-transformer';

export class EspecificacionDto {
  @IsString()
  marca: string;

  @IsString()
  modelo: string;

  @IsString()
  serie: string;
}
export class FormatoEquipoDto {
  @ValidateNested()
  @Type(() => EspecificacionDto)
  cpu: EspecificacionDto;

  @IsString()
  cpuProcesador: string;

  @IsString()
  cpuProceVelocidad: string;

  @IsString()
  cpuRam: string;

  @IsNumber()
  conector: TipoDiscoDuroConectorCode;

  @IsNumber()
  discoDuro: TipoDiscoDuroCode;

  @IsNumber()
  sistemaOperativoCode: SistemaOperativoCode;

  @IsBoolean()
  unidadDvd: boolean;

  /* MONITOR */
  @ValidateNested()
  @Type(() => EspecificacionDto)
  monitor: EspecificacionDto;

  /* TECLADO */
  @IsNumber()
  tecladoTipoCode: TipoEntradaConectorCode;

  /* MOUSE */
  @IsNumber()
  mouseTipoCode: TipoEntradaConectorCode;

  @IsBoolean()
  red: boolean;

  @IsString()
  direccionIp: string;
}

export class DocumentoDto {
  @IsNumber()
  activoId: number;

  @IsNumber()
  tipoEquipoCode: TipoEquipoCode;

  @IsString()
  @IsOptional()
  observacion: string;

  @IsString()
  ubicacion: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FormatoEquipoDto)
  computador: FormatoEquipoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EspecificacionDto)
  dispositivo: EspecificacionDto;

  @IsBoolean()
  isLaptop: boolean;
}

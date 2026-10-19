import { Type } from 'class-transformer';
import { MotivoDevolucionSumPacCode, TipoDevolucionCode } from '../../domain/types';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CustomDevolucionSumPacDto {
  @IsNumber()
  estanciaId: number;

  @IsNumber()
  @IsOptional()
  tipoCode: TipoDevolucionCode;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomDetDevDto)
  detalle: CustomDetDevDto[];
}

export class CustomDetDevDto {
  @IsNumber()
  @IsOptional()
  temporalId: number;

  @IsNumber()
  @IsOptional()
  productoId: number;

  @IsString()
  @IsOptional()
  nombreCustom: string;

  @IsString()
  @IsOptional()
  lote: string;

  @IsNumber()
  @IsOptional()
  cantidad: number;

  @IsNumber()
  @IsOptional()
  motivoDevolucionCode: MotivoDevolucionSumPacCode;

  @IsNumber()
  @IsOptional()
  estadoCode: 1 | 2 | 3;
}

import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { TipoMtoCode } from '../../domain/types';

export class AccesorioDto {
  @IsNumber()
  id: number;

  @IsString()
  nombre: string;
}
export class MantenimientoDto {
  @IsNumber()
  documentoId: number;

  @IsNumber({}, { each: true })
  @IsOptional()
  accesorioIds: number[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AccesorioDto)
  accesorios: AccesorioDto[];

  @IsNumber()
  tipoCode: TipoMtoCode;

  @IsString()
  numeroReporte: string;

  @IsNumber()
  valor: number;

  @IsString()
  observacion: string;

  @IsDateString()
  fechaNewMto: Date;
}

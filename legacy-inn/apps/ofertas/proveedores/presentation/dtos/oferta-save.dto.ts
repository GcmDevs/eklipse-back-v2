import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsString, Min } from 'class-validator';

export class OfertaSaveDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productoId: number;

  @IsString() principio: string;
  @IsString() concentracion: string;
  @IsString() marca: string;
  @IsString() expediente: string;
  @IsString() concecutivo: string;
  @IsString() registroSanitario: string;
  @IsString() fechaVencimientoRegistro: string; // yyyy-mm-dd
  @IsString() estadoRegistro: string;
  @IsString() clasificacionRiesgo: string;

  // IMPORTANTÍSIMO: Type para numbers también
  @Type(() => Number)
  @IsNumber()
  precioUnitario: number;

  @Type(() => Number)
  @IsNumber()
  iva: number;

  @IsString()
  presentacion: string;

  @Type(() => Number)
  @IsNumber()
  precioPresentacion: number;

  @IsString()
  regulado: string;
}

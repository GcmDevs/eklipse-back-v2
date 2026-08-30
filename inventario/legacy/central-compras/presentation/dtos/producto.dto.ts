import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class ProductoDto {
  @IsNumber()
  id: number;

  @IsString()
  codigoInterno: string;

  @IsString()
  clasificacion: string;

  @IsString()
  registroInvima: string;

  @IsNumber()
  precio: number;

  @IsBoolean()
  isIva: boolean;
}

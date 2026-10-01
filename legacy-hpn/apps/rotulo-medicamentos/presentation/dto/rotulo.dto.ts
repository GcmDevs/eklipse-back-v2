import { IsNumber, IsString } from 'class-validator';

export class CrearRotulosDto {
  @IsNumber() consecutivo: number;
  @IsString() productoId: string;
  @IsString() pacienteId: string;
}

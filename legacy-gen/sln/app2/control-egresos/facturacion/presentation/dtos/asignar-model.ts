import { IsDate, IsDateString, isDateString, IsNumber, IsString } from 'class-validator';
import { PrimaryGeneratedColumn } from 'typeorm';

export class AsignarDto {
  @IsNumber()
  id: number;

  @IsNumber()
  estado: number;

  @IsNumber()
  numero_ingreso: number;

  @IsNumber()
  numero_egreso: number;

  @IsString()
  observacion: string;

  @IsNumber()
  tipoCuenta: number;

  @IsString()
  usuarioAsignadoId: string;
}

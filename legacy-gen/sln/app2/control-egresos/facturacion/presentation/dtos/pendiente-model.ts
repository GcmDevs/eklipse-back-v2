import { IsDate, IsDateString, isDateString, IsNumber, IsString } from 'class-validator';
import { PrimaryGeneratedColumn } from 'typeorm';

export class PendienteDto {
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
  motivo_no_facturacion: number;
}

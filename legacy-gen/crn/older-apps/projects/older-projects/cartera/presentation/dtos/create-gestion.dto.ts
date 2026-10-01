import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGestionDto {
  @IsNumber()
  idTercero: number;

  @IsString()
  telefonoTercero: string;

  @IsString()
  nombreRepresentanteTercero: string;

  @IsString()
  motivoLlamada: string;

  @IsString()
  observacion: string;

  @IsOptional()
  @IsDateString(/* { null: true, allowNull: true } */)
  fechaConciliacion?: Date;

  @IsString()
  tipoConciliacion: string;
}

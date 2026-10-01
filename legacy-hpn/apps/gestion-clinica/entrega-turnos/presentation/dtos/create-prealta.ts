import { IsNumber, IsOptional, IsString } from 'class-validator';

export class FetchPrealtaDto {
  @IsNumber()
  ingresoId: number;
}

export class CreatePrealtaDto {
  @IsNumber()
  ingresoId: number;

  @IsNumber()
  pacienteId: number;

  @IsNumber()
  tiempoPrealta: number;

  @IsString()
  @IsOptional()
  observacion?: string;
}

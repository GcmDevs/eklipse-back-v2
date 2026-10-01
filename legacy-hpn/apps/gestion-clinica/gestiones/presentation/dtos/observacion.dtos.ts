import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ObservacionDto {
  @IsString()
  titulo: string;

  @IsString()
  descripcion: string;

  @IsNumber()
  importancia: number;

  @IsNumber()
  tipoGestion: number;

  @IsNumber()
  estadoGestion: number;

  @IsNumber()
  consecutivo: number;

  @IsNumber()
  paciente: number;

  @IsOptional()
  @IsNumber()
  usuarioAsignado?: number;

  @IsOptional()
  @IsNumber()
  descripcionUsuarioAsignado?: number;
}

export class ObservacionUpdateDto {
  @IsString()
  titulo: string;

  @IsString()
  descripcion: string;

  @IsNumber()
  importancia: number;

  @IsNumber()
  tipoGestion: number;

  @IsNumber()
  estadoGestion: number;

  @IsOptional()
  @IsNumber()
  usuarioAsignado?: number;

  @IsOptional()
  @IsNumber()
  descripcionUsuarioAsignado?: number;
}

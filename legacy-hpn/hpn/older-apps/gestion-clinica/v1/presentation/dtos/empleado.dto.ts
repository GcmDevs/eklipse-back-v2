import { TipoEmpleadoCode, TipoProfesionalCode } from '@hpn/gestion-clinica/v1/domain/types';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEmpleadoDto {
  @IsNumber()
  tipoEmpleadoCode: TipoProfesionalCode | TipoEmpleadoCode;

  @IsString()
  nombre: string;

  @IsString()
  documento: string;

  @IsString()
  @IsOptional()
  telefono: string;

  @IsNumber()
  institucionId: number;
}

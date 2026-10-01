import { TipoProfesionalCode, TipoEmpleadoCode } from '@ctypes/gcn';
import { IsNumber, IsString } from 'class-validator';

export class CreateEmpleadoDto {
  @IsNumber()
  tipoEmpleadoCode: TipoProfesionalCode | TipoEmpleadoCode;

  @IsString()
  nombre: string;

  @IsString()
  documento: string;

  @IsNumber()
  institucionId: number;
}

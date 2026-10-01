import { EntidadTypeCode } from '@ctypes/gcn';
import { IsNumber, IsString } from 'class-validator';

export class CreateEntidadDto {
  @IsNumber()
  tipoEntidadCode: EntidadTypeCode;

  @IsString()
  nombre: string;
}

import { GcmContextCode } from '@common/domain/types';
import { EntidadTypeCode } from '@hpn/gestion-clinica/v1/domain/types';
import { IsNumber, IsString } from 'class-validator';

export class CreateEntidadDto {
  @IsNumber()
  tipoEntidadCode: EntidadTypeCode;

  @IsString()
  nombre: string;
}

import { GcmContextCode } from '@common/domain/types';
import { TipoProfesionalCode } from '@hpn/gestion-clinica/v1/domain/types';
import { IsNumber, IsString } from 'class-validator';

export class CreateNotaDto {
  @IsNumber()
  trasladoId: number;

  @IsString()
  contextoCode: GcmContextCode;

  @IsNumber()
  tipo: TipoProfesionalCode;

  @IsString()
  nota: string;
}

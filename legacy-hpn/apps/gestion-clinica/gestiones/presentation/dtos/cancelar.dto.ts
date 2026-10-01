import { GcmContextCode } from '@common/domain/types';
import { IsNumber, IsString } from 'class-validator';

export class CancelarDto {
  @IsNumber()
  trasladoId: number;

  @IsString()
  contextoCode: GcmContextCode;

  @IsNumber()
  tipo: number;

  @IsString()
  obs: string;
}

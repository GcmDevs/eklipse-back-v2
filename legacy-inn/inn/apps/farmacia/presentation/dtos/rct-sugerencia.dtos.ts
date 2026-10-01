import { IsString, MaxLength, IsNumber } from 'class-validator';
import { RCTSugerenciaCode } from '../../domain/types/rec-tec';

export class CreateSugerenciaDto {
  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsNumber()
  tipo: RCTSugerenciaCode;
}

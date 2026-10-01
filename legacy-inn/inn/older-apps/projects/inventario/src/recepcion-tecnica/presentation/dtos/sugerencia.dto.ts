import { TipoSugerenciaTypeCode } from '@inn/old/inn/recepcion-tecnica/domain/types';
import { IsString, MaxLength, IsNumber } from 'class-validator';

export class CreateSugerenciaDto {
  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsNumber()
  tipo: TipoSugerenciaTypeCode;
}

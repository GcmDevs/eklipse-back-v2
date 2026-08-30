import { SugerenciaCode } from '@inn/lgc/rct/types/inn/farmacia/recepcion-tecnica';
import { IsString, MaxLength, IsNumber } from 'class-validator';

export class CreateSugerenciaDto {
  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsNumber()
  tipo: SugerenciaCode;
}

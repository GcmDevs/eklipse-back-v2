import { TipoSugerenciaTypeCode } from '@inn/old/orm/gcm/inventario/recepcion-tecnica';
import { IsString, MaxLength, IsNumber } from 'class-validator';

export class CreateSugerenciaRequest {
  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsNumber()
  tipo: TipoSugerenciaTypeCode;
}

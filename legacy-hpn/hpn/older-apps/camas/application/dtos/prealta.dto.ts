import { IsString, IsNotEmpty, IsArray } from 'class-validator';
import { PrealtaCode } from '@hpn/old/types/prealta';

export class PrealtaDto {
  @IsString()
  @IsNotEmpty({ message: 'El código de la cama es obligatorio' })
  codigoCama: string;

  @IsNotEmpty({ message: 'Debe seleccionar un motivo de prealta' })
  motivoPrealta: PrealtaCode;

  @IsString()
  @IsNotEmpty({ message: 'La observación es obligatoria' })
  observacion: string;
}

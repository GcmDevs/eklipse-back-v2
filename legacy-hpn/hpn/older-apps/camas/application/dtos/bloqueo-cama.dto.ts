import { BloqueoCamaCode } from '@hpn/old/types/bloqueo-cama';
import { IsArray, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class BloqueoCamaDto {
  @IsString()
  @IsNotEmpty({ message: 'El código de la cama es obligatorio' })
  codigoCama: string;

  @IsArray({ message: 'Debe enviar una lista de motivos de bloqueo' })
  @IsNotEmpty({ message: 'Debe seleccionar al menos un motivo de bloqueo' })
  motivoBloqueo: BloqueoCamaCode[];

  @IsString({ message: 'La observación es obligatoria' })
  @MinLength(5, { message: 'La observación debe tener al menos 5 caracteres' })
  observacion: string;
}

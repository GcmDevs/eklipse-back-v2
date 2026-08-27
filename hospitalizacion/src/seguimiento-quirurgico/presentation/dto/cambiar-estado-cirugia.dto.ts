import { IsString, MaxLength } from 'class-validator';
export class CambiarEstadoCirugiaDto {
  @IsString() @MaxLength(50) estadoDestino: string;
  @IsString() @MaxLength(50) estadoEsperado: string;
}

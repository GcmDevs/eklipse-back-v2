import { IsString, MaxLength } from 'class-validator';
export class RegistrarEventoCirugiaDto {
  @IsString() @MaxLength(50) codigoEvento: string;
}

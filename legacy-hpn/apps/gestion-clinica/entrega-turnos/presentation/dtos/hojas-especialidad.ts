import { IsInt, IsString, MaxLength, Min } from 'class-validator';

export class AgregarHojaEspecialidadDto {
  @IsInt() @Min(1) especialidadId: number;
}

export class GuardarHojaEspecialidadDto {
  @IsInt() @Min(0) version: number;
  @IsString() @MaxLength(1000000) contenido: string;
}

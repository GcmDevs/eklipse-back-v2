import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class RespuestaPacienteTrazadorDto {
  @ApiProperty()
  @IsNumber()
  pacienteId: number;

  @ApiProperty()
  @IsNumber()
  ingresoId: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  preguntaId: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  respuesta: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  observacionPregunta: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  observacionEncuesta: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isFinalizada: boolean;
}

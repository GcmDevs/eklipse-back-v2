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

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  auditorLider: string;

  @ApiProperty({ required: false, description: 'Integrantes del equipo auditor serializados en JSON.' })
  @IsString()
  @IsOptional()
  equipoAuditor: string;

  @ApiProperty({ required: false, description: 'Responsables de hallazgos serializados en JSON.' })
  @IsString()
  @IsOptional()
  responsablesHallazgos: string;
}

import { JornadaCode } from '@hpn/ori/die/domain/types/local';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateDietaDto {
  @IsNumber()
  jornadaCode: JornadaCode;

  @IsNumber()
  centroId: number;

  @IsNumber()
  subgrupoId: number;

  @IsNumber()
  horarioId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DietaDto)
  dietas: DietaDto[];
}

export class DietaDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  camaId: number;

  @IsNumber()
  pacienteId: number;

  @IsString()
  @IsOptional()
  dietaConfig: string;

  @IsString()
  @IsOptional()
  observacion: string | null;

  @IsBoolean()
  enAislamiento: boolean;
}

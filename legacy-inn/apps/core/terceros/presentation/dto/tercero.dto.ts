import { RolTercero } from '@orm/cor/rol-tercero.orm';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ResponseTerceroDto {
  id: number;
  nombre: string;
  identificacion?: string;
  correo?: string;
  telefono?: string;
  direccion?: string;

  pais?: {
    id: number;
    nombre: string;
    codigo: string;
  };

  roles: RolTercero[];
}

export class FilterTerceroDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(RolTercero)
  rol?: RolTercero;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;
}

export class CreateTerceroDto {
  @IsString()
  @MaxLength(200)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  identificacion?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccion?: string;

  @IsOptional()
  @IsInt()
  paisId?: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(RolTercero, { each: true })
  roles: RolTercero[];
}

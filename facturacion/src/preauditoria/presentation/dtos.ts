import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class VersionPreDto {
  @IsInt() @Min(1) version: number;
}
export class RecepcionPreDto {
  @IsUUID() analisisId: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(1e12) valor: number;
  @IsString() @MaxLength(25) recibido: string;
  @IsBoolean() netoConfirmado: boolean;
  @IsBoolean() identidadConfirmada: boolean;
  @IsOptional() @IsString() @MaxLength(1000) justificacion?: string;
  @IsOptional() @IsString() @MaxLength(200) facturador?: string;
}
export class GuardadoPreDto extends VersionPreDto {
  @IsArray() @ArrayMaxSize(1000) hallazgos: unknown[];
  @IsOptional() @IsString() @MaxLength(3000) notas?: string;
  @IsOptional() @IsString() @MaxLength(200) facturador?: string;
  @IsOptional() @IsInt() @Min(0) secuencia?: number;
}
export class AccionPreDto extends VersionPreDto {
  @IsIn([
    'asignar',
    'iniciar',
    'guardar',
    'esperar',
    'solicitarReasignacion',
    'solicitarReapertura',
    'reabrir',
    'anular',
    'corregirRecepcion',
  ])
  accion: string;
  @IsOptional() @IsString() @MaxLength(1000) motivo?: string;
  @IsOptional() @IsInt() @Min(1) responsableId?: number;
  @IsOptional() @IsArray() @ArrayMaxSize(1000) hallazgos?: unknown[];
  @IsOptional() @IsString() @MaxLength(3000) notas?: string;
  @IsOptional() @IsString() @MaxLength(200) facturador?: string;
  @IsOptional() @IsString() @MaxLength(25) recibido?: string;
}
export class FinalizarPreDto extends VersionPreDto {
  @IsUUID() vistaPrevia: string;
}
export class ItemEntregaDto extends VersionPreDto {
  @IsUUID() id: string;
}
export class EntregaPreDto {
  @IsUUID() solicitud: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ItemEntregaDto)
  items: ItemEntregaDto[];
}
export class ConfiguracionPreDto {
  @IsInt() @Min(1) @Max(8760) sinAsignar: number;
  @IsInt() @Min(1) @Max(8760) auditoria: number;
  @IsInt() @Min(1) @Max(8760) entrega: number;
}
export class CupPreDto {
  @IsString() @MaxLength(30) codigo: string;
  @IsString() @MaxLength(600) nombre: string;
}
export class SalarioPreDto {
  @IsInt() @Min(1) usuario: number;
  @IsString() @MaxLength(10) vigencia: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(1e9) salario: number;
}
export class HoraPreDto {
  @IsOptional() @IsUUID() id?: string;
  @IsOptional() @IsInt() @Min(1) version?: number;
  @IsOptional() @IsString() @MaxLength(10) fecha?: string;
  @IsOptional() @IsString() @MaxLength(5) inicio?: string;
  @IsOptional() @IsString() @MaxLength(5) fin?: string;
  @IsOptional() @IsBoolean() diaSiguiente?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(6) descanso?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(240) divisor?: number;
  @IsOptional() @IsBoolean() recargoCompleto?: boolean;
  @IsOptional() @IsString() @MaxLength(1000) nota?: string;
  @IsOptional() @IsBoolean() reportado?: boolean;
  @IsOptional() @IsBoolean() soloReporte?: boolean;
}

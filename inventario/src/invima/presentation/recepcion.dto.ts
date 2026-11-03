import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { TIPOS_PRODUCTO_INVIMA, TipoProductoInvima } from '../domain/invima.models';
import {
  DecisionRecepcion,
  FisicoRecepcion,
  FisicoBorradorRecepcion,
} from '../domain/recepcion.models';

class LoteFisicoDto {
  @IsOptional() @IsNumber() @Min(0) cantidad: number | null;
  @IsString() @MaxLength(120) lote: string;
  @IsString() @MaxLength(10) vencimiento: string;
}
export class FisicoRecepcionDto implements FisicoRecepcion {
  @IsIn(TIPOS_PRODUCTO_INVIMA) tipo: TipoProductoInvima;
  @IsString() @MaxLength(240) descripcion: string;
  @IsOptional() @IsNumber() @Min(0) cantidad: number | null;
  @IsString() @MaxLength(120) codigoDeclarado: string;
  @IsString() @MaxLength(100) registroSanitario: string;
  @IsString() @MaxLength(120) ium: string;
  @IsString() @MaxLength(120) numeroResolucion: string;
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => LoteFisicoDto)
  lotes: LoteFisicoDto[];
  @IsNumber() @Min(0) cantidadAveria: number;
  @IsNumber() @Min(0) cantidadNoSolicitada: number;
  @IsIn(['', 'BUENO', 'ACEPTABLE', 'DETERIORADO']) estadoEmpaque: FisicoRecepcion['estadoEmpaque'];
  @IsString() @MaxLength(120) riesgo: string;
  @IsString() @MaxLength(240) marca: string;
  @IsString() @MaxLength(120) concentracion: string;
  @IsString() @MaxLength(120) unidadConcentracion: string;
  @IsOptional() @IsNumber() temperatura: number | null;
  @IsIn(['C', 'F', 'K']) unidadTemperatura: FisicoRecepcion['unidadTemperatura'];
  @IsString() @MaxLength(240) laboratorio: string;
  @IsString() @MaxLength(1000) presentacion: string;
  @IsString() @MaxLength(160) formaFarmaceutica: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  registroSanitarioRevisado?: boolean;
  @IsBoolean() etiquetaConforme: boolean;
  @IsBoolean() sellosConformes: boolean;
  @IsBoolean() fabricanteConforme: boolean;
  @IsInt() @Min(0) erroresCriticos: number;
  @IsArray()
  @ArrayMaxSize(2)
  @IsIn(['CUM', 'INVIMA'], { each: true })
  motivosRechazo: FisicoRecepcion['motivosRechazo'];
}
export class VersionRecepcionDto {
  @IsInt() @Min(1) version: number;
}
export class GuardarRecepcionItemDto extends VersionRecepcionDto {
  @IsInt() @Min(1) recepcionVersion: number;
  @IsDefined() @ValidateNested() @Type(() => FisicoRecepcionDto) fisico: FisicoRecepcionDto;
  @IsIn(['PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'NO_RECIBIDO']) decision: DecisionRecepcion;
  @IsString() @MaxLength(4000) justificacion: string;
}

class LoteBorradorDto {
  @ValidateIf((_object, value) => value !== null) @IsNumber() cantidad: number | null;
  @IsString() @MaxLength(120) lote: string;
  @IsString() @MaxLength(10) vencimiento: string;
}
// Drafts retain unfinished inputs; physical rules still apply when the product is committed.
export class FisicoBorradorRecepcionDto implements FisicoBorradorRecepcion {
  @IsIn(TIPOS_PRODUCTO_INVIMA) tipo: TipoProductoInvima;
  @IsString() @MaxLength(240) descripcion: string;
  @ValidateIf((_object, value) => value !== null) @IsNumber() cantidad: number | null;
  @IsString() @MaxLength(120) codigoDeclarado: string;
  @IsString() @MaxLength(100) registroSanitario: string;
  @IsString() @MaxLength(120) ium: string;
  @IsString() @MaxLength(120) numeroResolucion: string;
  @IsArray()
  @ArrayMaxSize(500)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => LoteBorradorDto)
  lotes: LoteBorradorDto[];
  @ValidateIf((_object, value) => value !== null) @IsNumber() cantidadAveria: number | null;
  @ValidateIf((_object, value) => value !== null) @IsNumber() cantidadNoSolicitada: number | null;
  @IsIn(['', 'BUENO', 'ACEPTABLE', 'DETERIORADO']) estadoEmpaque: FisicoRecepcion['estadoEmpaque'];
  @IsString() @MaxLength(120) riesgo: string;
  @IsString() @MaxLength(240) marca: string;
  @IsString() @MaxLength(120) concentracion: string;
  @IsString() @MaxLength(120) unidadConcentracion: string;
  @ValidateIf((_object, value) => value !== null) @IsNumber() temperatura: number | null;
  @IsIn(['C', 'F', 'K']) unidadTemperatura: FisicoRecepcion['unidadTemperatura'];
  @IsString() @MaxLength(240) laboratorio: string;
  @IsString() @MaxLength(1000) presentacion: string;
  @IsString() @MaxLength(160) formaFarmaceutica: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  registroSanitarioRevisado?: boolean;
  @IsBoolean() etiquetaConforme: boolean;
  @IsBoolean() sellosConformes: boolean;
  @IsBoolean() fabricanteConforme: boolean;
  @ValidateIf((_object, value) => value !== null) @IsNumber() erroresCriticos: number | null;
  @IsArray()
  @ArrayMaxSize(2)
  @IsIn(['CUM', 'INVIMA'], { each: true })
  motivosRechazo: FisicoRecepcion['motivosRechazo'];
}
export class GuardarBorradorRecepcionDto extends VersionRecepcionDto {
  @IsInt() @Min(1) recepcionVersion: number;
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => FisicoBorradorRecepcionDto)
  fisico: FisicoBorradorRecepcionDto;
  @IsIn(['PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'NO_RECIBIDO']) decision: DecisionRecepcion;
  @IsString() @MaxLength(4000) justificacion: string;
}

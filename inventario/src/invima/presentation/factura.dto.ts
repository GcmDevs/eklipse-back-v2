import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { RenglonFactura } from '../domain/factura.models';
import { TIPOS_PRODUCTO_INVIMA } from '../domain/invima.models';
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RenglonFacturaDto implements RenglonFactura {
  @IsOptional() @IsInt() @Min(1) id?: number;
  @IsOptional() @IsInt() @Min(1) productoVersion?: number;
  @IsIn(TIPOS_PRODUCTO_INVIMA) tipo: RenglonFactura['tipo'];
  @Transform(trim) @IsString() @MaxLength(240) descripcion: string;
  @Transform(trim) @IsString() @MaxLength(120) codigoDeclarado: string;
  @Transform(trim) @IsString() @MaxLength(100) registroSanitario: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(80) unidadMedida?: string;
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  cantidad?: number | null;
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  cantidadPresentacion?: number | null;
  @IsBoolean() excluido: boolean;
}
export class GuardarFacturaDto {
  @IsInt() @Min(1) version: number;
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(100) numero: string;
  @Transform(trim) @IsString() @MaxLength(240) proveedor: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(240) cliente?: string;
  @Transform(trim) @IsString() @MaxLength(30) nitProveedor: string;
  @IsOptional() @IsDateString({ strict: true }) fecha?: string | null;
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => RenglonFacturaDto)
  renglones: RenglonFacturaDto[];
}
export class ListarFacturasDto {
  @Type(() => Number) @IsInt() @Min(1) pagina = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) limite = 20;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(240) q?: string;
  @IsOptional() @IsIn(['BORRADOR', 'REVISADA']) estado?: 'BORRADOR' | 'REVISADA';
}
export class EliminarFacturaDto {
  @Type(() => Number) @IsInt() @Min(1) version: number;
}

export class ObservacionFacturaDto {
  @IsInt() @Min(0) version: number;
  @IsOptional() @IsInt() @Min(1) renglonId?: number;
  @IsString() @MaxLength(4000) texto: string;
}

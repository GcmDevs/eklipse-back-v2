import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, MaxLength, ValidateNested } from 'class-validator';
import { ProductoDto } from './producto.dto';
import { GcmContexts } from '@common/domain/types';

export class DetalleDto {
  @IsNumber()
  id: number;

  @IsNumber()
  cantidad: number;
}

export class SetDto {
  @IsString()
  @MaxLength(300)
  nombre: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleDto)
  detalle: DetalleDto[];
}
export class AddSetProveeDto {
  @IsNumber()
  proveedorId: number;

  @IsNumber()
  setId: number;

  @IsString()
  context: GcmContexts;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductoDto)
  productos: ProductoDto[];
}

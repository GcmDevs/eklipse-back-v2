import { TipoPagoCode } from '@inn/lgc/ctc/types/inn/central-compras/cotizaciones';
import { CotizacionPrefabricadaOrm } from '@inn/lgc/ctc/orm/inn/central-compras/cotizacion-prefabricada.orm';
import { ProductoOrm } from '@inn/lgc/ctc/orm/inn/productos';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CotiPrefaDto {
  @IsNumber()
  terceroId: number;

  @IsNumber()
  @IsOptional()
  almacenId: number;

  @IsString()
  @IsOptional()
  justificacion: string;

  @IsNumber()
  tipoPagoCode: TipoPagoCode;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CotiPrefaItemDto)
  detalle: CotiPrefaItemDto[];

  cotizacionPrefabricada: CotizacionPrefabricadaOrm;
}

export class CotiPrefaItemDto {
  @IsNumber()
  productoId: number;

  @IsNumber()
  cantidad: number;

  producto: ProductoOrm;
  valor: number;
  IVA: number;
}

export class UpdateValorDto {
  @IsNumber()
  terceroId: number;

  @IsNumber()
  productoId: number;

  @IsNumber()
  valor: number;
}

export class AddOfertaDto {
  @IsNumber()
  terceroId: number;

  @IsNumber()
  productoId: number;

  @IsNumber()
  valor: number;
}

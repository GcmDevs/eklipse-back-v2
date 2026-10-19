import {
  UnidadMedidaTemperaturaTypeCode,
  EstadoRegInvimaTypeCode,
  EstadosEmbalajeTypeCode,
  TipoProductoTypeCode,
  TipoRiesgoTypeCode,
  TipoProveedorTypeCode,
} from '@inn/old/inn/recepcion-tecnica/domain/types';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ItemProdDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  cantidad: number;

  @Type(() => Date)
  @IsDate()
  fecha: Date;

  @IsString()
  @MaxLength(20)
  lote: string;
}
export class NewProductoRecTecDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  producto: number;

  @IsNumber()
  tipoProducto: TipoProductoTypeCode;

  @IsNumber()
  @IsOptional()
  riesgoProducto: TipoRiesgoTypeCode;

  @IsNumber()
  tamanioMuestra: number;

  @IsString()
  nivelInspeccion: string;

  @IsNumber()
  cantErrCriticos: number;

  @IsNumber()
  cantErrMayores: number;

  @IsNumber()
  cantErrMenores: number;

  @IsBoolean()
  cumpleRecepcionTecnica: boolean;

  @IsNumber()
  @IsOptional()
  concentracion?: number;

  @IsNumber()
  @IsOptional()
  unidadMedidaConcentracion?: number;

  @IsNumber()
  presentacion: number;

  @IsNumber()
  @IsOptional()
  formaFarmaceutica?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemProdDto)
  items: ItemProdDto[];

  @IsNumber()
  temperatura: number;

  @IsNumber()
  unidadMedidaTemperatura: UnidadMedidaTemperaturaTypeCode;

  @IsNumber()
  laboratorio: number;

  @IsString()
  @MaxLength(100)
  registroInvima: string;

  @IsNumber()
  estadoRegistroInvima: EstadoRegInvimaTypeCode;

  @IsString()
  cum: string;

  @IsNumber()
  estado: EstadosEmbalajeTypeCode;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  cantidadEntregada: number;

  @IsNumber()
  tipoProveedor: TipoProveedorTypeCode;

  @IsString()
  @IsOptional()
  numeroSerie?: string;

  @IsString()
  @IsOptional()
  vidaUtil?: string;

  @IsString()
  marca: string;
}

export class NewRecTecDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewProductoRecTecDto)
  productos: NewProductoRecTecDto[];

  @IsNumber()
  laboratorio: number;

  @IsNumber()
  centroId: number;

  @IsString()
  @MaxLength(30)
  numeroFactura: string;

  @IsString()
  @MaxLength(30)
  numeroGuia: string;

  @IsNumber()
  transportadora: number;

  @IsString()
  @MaxLength(300)
  observacion: string;
  /* 
  @IsNumber()
  condicionTransporte: CondicionTransporteTypeCode;

  @IsNumber()
  tipoEmbalaje: EstadosEmbalajeTypeCode; */

  @IsString()
  @IsOptional()
  consecutivoOrdenCompra: string;
}

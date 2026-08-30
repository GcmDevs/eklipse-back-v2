import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { TipoProductoCode } from '@inn/lgc/rct/types/inn/farmacia/recepcion-tecnica';
import { TipoDocumentoCode } from '@inn/lgc/rct/types/inn/documentos';
import {
  TemperaturaCode,
  EstadosEmbalajeCode,
} from '@inn/lgc/rct/types/inn/farmacia/recepcion-tecnica';
import { RiesgoProductoCode } from '@inn/lgc/rct/types/inn/productos';

export class ItemLoteProdDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  cantidad: number;

  @IsString()
  @MaxLength(20)
  lote: string;

  @Type(() => Date)
  @IsDate()
  fechaVencimiento: Date;
}

export class RTCProductoDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  itemDetalleId: number;

  @IsNumber()
  tipoProductoCode: TipoProductoCode;

  @IsNumber()
  @IsOptional()
  riesgoProductoCode?: RiesgoProductoCode;

  @IsBoolean()
  @IsOptional()
  ignore?: boolean;

  @IsNumber()
  tamanioMuestra: number;

  @IsString()
  nivelInspeccion: string;

  @IsNumber()
  cantidadErrores: number;

  @IsBoolean()
  verifiRegSanINVIMA: boolean;

  @IsBoolean()
  reviEtiquetaProducto: boolean;

  @IsBoolean()
  reviOrtografiaSellos: boolean;

  @IsBoolean()
  correspFabriExpediSani: boolean;

  @IsBoolean()
  cumpleRecepcionTecnica: boolean;

  @IsNumber()
  @IsOptional()
  concentracion?: number;

  @IsNumber()
  productoId: number;

  @IsNumber()
  presentacionId: number;

  @IsNumber()
  laboratorioId: number;

  @IsNumber()
  @IsOptional()
  UMConcentracionId?: number;

  @IsNumber()
  @IsOptional()
  formaFarmaceuticaId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemLoteProdDto)
  @IsOptional()
  lotes: ItemLoteProdDto[];

  @IsNumber()
  temperatura: number;

  @IsNumber()
  UMTemperaturaCode: TemperaturaCode;

  @IsString()
  @MaxLength(100)
  registroInvima: string;

  @IsString()
  @IsOptional()
  cum?: string;

  @IsNumber()
  estadoEmbalajeCode: EstadosEmbalajeCode;

  @IsString()
  marca: string;

  @IsString()
  @IsOptional()
  numeroSerie?: string;

  @IsNumber()
  @IsOptional()
  vidaUtilId?: number;

  @IsString()
  @MaxLength(300)
  @IsOptional()
  observacion: string;
}

export class CreateRTCDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  centroId: number;

  @IsBoolean()
  isLastItem: boolean;

  @IsNumber()
  documentoId: number;

  @IsNumber()
  tipoDocumentoCode: TipoDocumentoCode;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RTCProductoDto)
  detalle: RTCProductoDto[];

  @IsString()
  @MaxLength(30)
  codigoFactura: string;

  @IsNumber()
  transportadoraId: number;
}

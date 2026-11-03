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
  IsIn,
  Min,
} from 'class-validator';
import { InspeccionGuardada } from '../../../../src/recepcion-tecnica/inspeccion';

export class NovedadInspeccionDto {
  @IsIn(['AVERIA', 'FALTANTE', 'SOBRANTE', 'NO_SOLICITADO'])
  tipo: 'AVERIA' | 'FALTANTE' | 'SOBRANTE' | 'NO_SOLICITADO';
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  cantidad: number;
}
export class InspeccionDto {
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  cantidadFacturada: number;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NovedadInspeccionDto)
  novedades: NovedadInspeccionDto[];
  @IsArray()
  @IsIn(['CUM', 'INVIMA'], { each: true })
  motivosRechazo: ('CUM' | 'INVIMA')[];
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ium?: string;
  @IsOptional()
  @IsString()
  @MaxLength(100)
  numeroResolucion?: string;
}
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
  @IsOptional()
  @ValidateNested()
  @Type(() => InspeccionDto)
  inspeccion?: InspeccionDto;
  // Asignado únicamente por el servidor, no se acepta en el contrato de entrada.
  inspeccionPersistida?: InspeccionGuardada;
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  itemDetalleId: number;

  @IsIn([1, 2, 3, 4])
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

  @IsOptional()
  @IsNumber()
  temperatura: number;

  @IsNumber()
  UMTemperaturaCode: TemperaturaCode;

  @IsOptional()
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

  @IsOptional()
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

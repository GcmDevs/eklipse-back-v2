import {
  CondicionTransporteTypeCode,
  EstadoRegInvimaTypeCode,
  EstadosEmbalajeTypeCode,
  UnidadMedidaTemperaturaTypeCode,
} from '@inn/old/orm/gcm/inventario/recepcion-tecnica';
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

export class RecepcionTecnicaProductoRequest {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  producto: number;

  @IsNumber()
  concentracion: number;

  @IsNumber()
  unidadMedidaConcentracion: number;

  @IsNumber()
  presentacion: number;

  @IsNumber()
  formaFarmaceutica: number;

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

  @Type(() => Date)
  @IsDate()
  fechaVencimiento: Date;

  @IsString()
  @MaxLength(20)
  lote: string;

  @IsNumber()
  cantidad: number;
}

export class CreateRecepcionTecnicaRequest {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecepcionTecnicaProductoRequest)
  productos: RecepcionTecnicaProductoRequest[];

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

  @IsNumber()
  condicionTransporte: CondicionTransporteTypeCode;

  @IsBoolean()
  cumpleRecepcionTecnica: boolean;

  @IsNumber()
  tipoEmbalaje: EstadosEmbalajeTypeCode;
}

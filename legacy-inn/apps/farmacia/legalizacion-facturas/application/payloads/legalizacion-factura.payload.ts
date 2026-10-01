import { GcmContextCode } from '@common/domain/types';
import { EstadoControlGastoCode } from '@ctypes/inn/farmacia/control-gastos';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLegalizacionFacturasPayload {
  @IsString()
  documentoFileName: string;

  @IsNumber()
  sedeId: number;

  @IsString()
  contextCode: GcmContextCode;

  @IsString()
  numeroFactura: string;
}

export class CargarFacturaLegalizacionFacturaPayload {
  @IsString()
  contextCode: GcmContextCode;

  @IsNumber()
  legalizacionFactId: number;

  @IsString()
  facturaFileName: string;
}

export class DocumentoVistoLegalizacionFacturaPayload {
  @IsString()
  contextCode: GcmContextCode;

  @IsNumber()
  legalizacionFactId: number;

  @IsBoolean()
  hasVisto: boolean;
}

export class RechazarLegalizacionFacturaPayload {
  @IsString()
  contextCode: GcmContextCode;

  @IsNumber()
  legalizacionFactId: number;

  @IsString()
  observacionRechazo: string;
}

export class GenerateReporteLegalizacionFacturaPayoad {
  @IsString()
  contextCode: GcmContextCode;

  @IsNumber()
  legalizacionFactId: number;

  @IsNumber()
  estadoCode: EstadoControlGastoCode;

  @IsString()
  @IsOptional()
  observacion: string;
}

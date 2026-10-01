import {
  OptionalBoolean,
  OptionalDateString,
  OptionalInteger,
  OptionalNestedArray,
  OptionalText,
  RequiredDateString,
  RequiredEnum,
  RequiredInteger,
  RequiredIntegerArray,
} from '@common/presentation/decorators';
import { TipoAdquisicion } from '@equipos/domain/enums';
import { PartialType } from '@nestjs/swagger';
import { CreateDocumentoNestedDto } from '../catalogo';

export class CreateCompraDto {
  @OptionalText({ maxLength: 30 })
  codigo?: string;

  @RequiredDateString()
  fechaCompra: string;

  @RequiredEnum(TipoAdquisicion)
  tipoAdquisicion: TipoAdquisicion;

  @RequiredInteger({ min: 1 })
  proveedorId: number;

  @OptionalText({ maxLength: 100 })
  numFactura?: string;

  @OptionalDateString()
  fechaFactura?: string;

  @OptionalDateString()
  fechaFabricacion?: string;

  @OptionalBoolean()
  aplicaGarantia?: boolean;

  @OptionalDateString()
  fechVencGarantia?: string;

  @OptionalInteger({ min: 1 })
  fabricanteId?: number;

  @OptionalInteger({ min: 1 })
  distribuidorId?: number;

  @OptionalText({ maxLength: 600 })
  observaciones?: string;

  @OptionalNestedArray(() => CreateDocumentoNestedDto)
  documentos?: CreateDocumentoNestedDto[];
}

export class UpdateCompraDto extends PartialType(CreateCompraDto) {}

export class AgregarEquiposCompraDto {
  @RequiredIntegerArray({ min: 1 })
  equipoIds: number[];
}

import {
  OptionalInteger,
  OptionalNumber,
  OptionalText,
  RequiredEnum,
  RequiredInteger,
  RequiredNestedArray,
  RequiredNumber,
  RequiredText,
} from '@common/presentation/decorators';
import { TipoCombustible, UnidadMedidaCombustible } from '@vehiculos/domain/enums';
import { EvidenciaItemDto } from './tanqueo.dto';

export class CreateRepositorioCombustibleDto {
  @RequiredText({ maxLength: 150 })
  nombre: string;

  @RequiredEnum(TipoCombustible)
  tipoCombustible: TipoCombustible;

  @RequiredEnum(UnidadMedidaCombustible)
  unidadMedidaCombustible: UnidadMedidaCombustible;

  @RequiredNumber({ min: 0.01 })
  capacidad: number;

  @OptionalNumber({ min: 0 })
  stockInicial?: number;
}

export class CreateEntradaRepositorioDto {
  @RequiredInteger({ min: 1 })
  estacionServicioId: number;

  @RequiredNumber({ min: 0.01 })
  cantidadCombustible: number;

  @RequiredEnum(UnidadMedidaCombustible)
  unidadMedidaCombustible: UnidadMedidaCombustible;

  @RequiredEnum(TipoCombustible)
  tipoCombustible: TipoCombustible;

  @RequiredNumber({ min: 0.01 })
  valorPagado: number;

  @RequiredText()
  fechaAbastecimiento: string;

  @OptionalNumber()
  latitud?: number;

  @OptionalNumber()
  longitud?: number;

  @OptionalNumber({ min: 0 })
  precisionMetros?: number;

  @OptionalText({ maxLength: 1000 })
  observaciones?: string;

  @RequiredNestedArray(() => EvidenciaItemDto)
  evidencias: EvidenciaItemDto[];
}

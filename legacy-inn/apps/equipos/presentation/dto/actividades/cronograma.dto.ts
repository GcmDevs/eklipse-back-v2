import {
  OptionalEnum,
  OptionalInteger,
  OptionalNumber,
  OptionalText,
  RequiredEnum,
  RequiredInteger,
} from '@common/presentation/decorators';
import { TipoActividad, EstadoCronograma } from '@equipos/domain/enums';

export class CreateCronogramaDto {
  @RequiredInteger({ min: 2000, max: 2100 })
  anio: number;

  @RequiredInteger({ min: 1, max: 12 })
  mes: number;

  @RequiredEnum(TipoActividad)
  tipo: TipoActividad;

  @OptionalNumber({ min: 0, max: 100 })
  metaCumplimientoPct?: number;

  @OptionalText({ maxLength: 600 })
  notas?: string;
}

export class UpdateCronogramaDto {
  @OptionalNumber({ min: 0, max: 100 })
  metaCumplimientoPct?: number;

  @OptionalText({ maxLength: 600 })
  notas?: string;
}

export class FilterCronogramaDto {
  @OptionalInteger({ min: 2000, max: 2100 })
  anio?: number;

  @OptionalInteger({ min: 1, max: 12 })
  mes?: number;

  @OptionalEnum(TipoActividad)
  tipo?: TipoActividad;

  @OptionalEnum(EstadoCronograma)
  estado?: EstadoCronograma;
}

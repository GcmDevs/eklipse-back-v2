import {
  OptionalBoolean,
  OptionalEnum,
  OptionalInteger,
  OptionalText,
  RequiredBoolean,
} from '@common/presentation/decorators';
import { PaginationDto } from '@common/presentation/dto';
import { SeveridadInconsistencia } from '@vehiculos/domain/enums';

export class FilterInconsistenciaDto extends PaginationDto {
  @OptionalInteger({ min: 1 })
  tanqueoId?: number;

  @OptionalEnum(SeveridadInconsistencia)
  severidad?: SeveridadInconsistencia;

  @OptionalBoolean()
  contactoRealizado?: boolean;
}

export class ResolveInconsistenciaDto {
  @RequiredBoolean()
  contactoRealizado: boolean;

  @OptionalText({ maxLength: 500 })
  notaResolucion?: string;

  @OptionalText({ maxLength: 500 })
  notaContacto?: string;
}

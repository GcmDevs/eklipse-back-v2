import {
  OptionalEnum,
  OptionalInteger,
  OptionalText,
  RequiredEnum,
  RequiredText,
} from '@common/presentation/decorators';
import { PaginationDto } from '@common/presentation/dto';
import {
  EstadoEquipo,
  EstadoSolicitud,
  MotivoCambioEstadoEquipo,
  TipoAccionAprobacion,
} from '@equipos/domain/enums';

export class RejectSolicitudDto {
  @RequiredText({ maxLength: 400 })
  motivoRechazo: string;
}

export class ChangeEstadoSolicitudDto {
  @RequiredEnum(EstadoEquipo)
  nuevoEstado: EstadoEquipo;

  @RequiredEnum(MotivoCambioEstadoEquipo)
  motivo: MotivoCambioEstadoEquipo;

  @OptionalText({ maxLength: 500 })
  observaciones?: string;
}

export class FilterSolicitudDto extends PaginationDto {
  @OptionalInteger({ min: 1 })
  equipoId?: number;

  @OptionalEnum(EstadoSolicitud)
  estado?: EstadoSolicitud;

  @OptionalEnum(TipoAccionAprobacion)
  tipo?: TipoAccionAprobacion;

  @OptionalText()
  search?: string;
}

export class ResponseCreatedSolicitudDto {
  autoaprobada: boolean;
  solicitudId?: number;
  solicitudCodigo?: string;
}

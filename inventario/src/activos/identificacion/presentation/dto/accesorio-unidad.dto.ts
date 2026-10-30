import { OptionalText, RequiredEnum } from '@common/presentation/decorators';
import { EstadoAccesorioUnidad } from '@inn/activos/identificacion/domain/enums';

export class ChangeEstadoAccesorioUnidadDto {
  @RequiredEnum(EstadoAccesorioUnidad)
  estado: EstadoAccesorioUnidad;
}

export class UpdateObservacionesAccesorioUnidadDto {
  @OptionalText({ maxLength: 300 })
  observaciones?: string;
}

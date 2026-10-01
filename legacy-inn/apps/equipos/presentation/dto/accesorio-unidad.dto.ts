import { OptionalText, RequiredEnum } from '@common/presentation/decorators';
import { EstadoAccesorioUnidad } from '@equipos/domain/enums';

export class ChangeEstadoAccesorioUnidadDto {
  @RequiredEnum(EstadoAccesorioUnidad)
  estado: EstadoAccesorioUnidad;
}

export class UpdateObservacionesAccesorioUnidadDto {
  @OptionalText({ maxLength: 300 })
  observaciones?: string;
}

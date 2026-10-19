import { RequiredEnum, RequiredInteger } from '@common/presentation/decorators';
import { UnidadTiempo } from '../../domain/enums';

export class CreatePeriodoDeTiempoDto {
  @RequiredInteger({ min: 1 })
  valor: number;

  @RequiredEnum(UnidadTiempo)
  unidad: UnidadTiempo;
}

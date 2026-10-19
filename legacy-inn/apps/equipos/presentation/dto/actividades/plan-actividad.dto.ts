import {
  OptionalBoolean,
  OptionalDate,
  OptionalEnum,
  OptionalInteger,
  OptionalNested,
  OptionalText,
} from '@common/presentation/decorators';
import { OrigenInicializacionPlan } from '@equipos/domain/enums';
import { PartialType } from '@nestjs/swagger';
import { CreatePeriodoDeTiempoDto } from '../common.dto';

export class CreatePlanActividadDto {
  @OptionalNested(() => CreatePeriodoDeTiempoDto)
  periocidad?: CreatePeriodoDeTiempoDto;

  @OptionalInteger({ min: 1 })
  formatoId?: number;

  @OptionalBoolean()
  seRealizaPorExterno?: boolean;

  @OptionalEnum(OrigenInicializacionPlan)
  origenInicializacion?: OrigenInicializacionPlan;

  @OptionalDate()
  fechaUltimaEjecucion?: Date;

  @OptionalInteger({ min: 1 })
  diasAnticipacionNotificacion?: number;

  @OptionalText({ maxLength: 500 })
  observaciones?: string;
}

export class UpdatePlanActividadDto extends PartialType(CreatePlanActividadDto) {}

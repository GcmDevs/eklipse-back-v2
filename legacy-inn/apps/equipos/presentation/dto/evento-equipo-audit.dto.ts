import { OptionalEnum } from '@common/presentation/decorators';
import { PaginationDto } from '@common/presentation/dto';
import { TipoEventoAuditEquipo } from '@equipos/domain/enums/tipos-audit-equipo.enum';

export enum EventoEquipoAuditViewMode {
  FLAT = 'FLAT',
  WORKFLOW = 'WORKFLOW',
  INCIDENCIAS_EXTERNAS = 'INCIDENCIAS_EXTERNAS',
}

export enum WorkflowOrderBy {
  ROOT_DATE = 'ROOT_DATE',
  LAST_ACTIVITY = 'LAST_ACTIVITY',
}

export class FilterEventoAuditEquipoDto extends PaginationDto {
  @OptionalEnum(TipoEventoAuditEquipo)
  tipo?: TipoEventoAuditEquipo;

  @OptionalEnum(EventoEquipoAuditViewMode)
  view?: EventoEquipoAuditViewMode = EventoEquipoAuditViewMode.FLAT;

  @OptionalEnum(WorkflowOrderBy)
  workflowOrderBy?: WorkflowOrderBy;
}

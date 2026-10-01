import {
  OptionalBoolean,
  OptionalBooleanQuery,
  OptionalDate,
  OptionalEnum,
  OptionalInteger,
  OptionalNested,
  OptionalNestedArray,
  OptionalNumber,
  OptionalText,
  RequiredDate,
  RequiredEnum,
  RequiredEnumWhen,
  RequiredInteger,
} from '@common/presentation/decorators';
import { PaginationDto } from '@common/presentation/dto';
import { AnexoItemDto } from '@core/media/presentation/dto';
import {
  EstadoActividad,
  MotivoEjecucionExternaExcepcional,
  MotivoReprogramacionActividad,
  NaturalezaIntervencionActividad,
  OrigenActividad,
  PrioridadActividad,
  TipoActividad,
  TipoEjecutorExterno,
} from '@equipos/domain/enums';
import { IntersectionType } from '@nestjs/swagger';

export class EjecucionExternaEmbebidaDto {
  @RequiredEnum(TipoEjecutorExterno)
  tipoEjecutor: TipoEjecutorExterno;

  @RequiredDate()
  fechaEjecucion: Date;

  @OptionalInteger({ min: 1 })
  terceroTecnicoId?: number;

  @OptionalInteger({ min: 1 })
  empresaTerceroId?: number;

  @OptionalText({ maxLength: 600 })
  observaciones?: string;

  @OptionalBoolean()
  esExcepcional?: boolean;

  @RequiredEnumWhen(
    MotivoEjecucionExternaExcepcional,
    (o: EjecucionExternaEmbebidaDto) => o.esExcepcional === true)
  motivoExcepcional?: MotivoEjecucionExternaExcepcional;

  @OptionalText({ maxLength: 400 })
  motivoExcepcionalDetalle?: string;

  @OptionalNestedArray(() => AnexoItemDto, { maxSize: 10 })
  anexos?: AnexoItemDto[];
}

export class CreateRegistroActividadDto {
  @RequiredInteger({ min: 1 })
  equipoId: number;

  @RequiredEnum(TipoActividad)
  tipo: TipoActividad;

  @RequiredEnum(OrigenActividad)
  origen: OrigenActividad;

  @RequiredEnum(NaturalezaIntervencionActividad)
  naturaleza: NaturalezaIntervencionActividad;

  @RequiredDate()
  fechaRealizacion: Date;

  @RequiredDate()
  fechaInicio: Date;

  @RequiredDate()
  fechaFinalizacion: Date;

  @RequiredEnum(PrioridadActividad)
  prioridad: PrioridadActividad;

  @OptionalText()
  observaciones?: string;

  @OptionalText({ maxLength: 50 })
  tecnicoResponsable?: string;

  @OptionalInteger({ min: 1 })
  solicitadoPorId?: number;

  @OptionalNumber({ min: 0 })
  costoManoObra?: number;

  @OptionalNumber({ min: 0 })
  costoRepuestos?: number;

  @OptionalNestedArray(() => AnexoItemDto, { maxSize: 10 })
  anexos?: AnexoItemDto[];
}

export class CompleteActividadProgramadaDto {
  @RequiredInteger({ min: 1 })
  equipoId: number;

  @RequiredEnum(TipoActividad)
  tipo: TipoActividad;

  @RequiredDate()
  fechaRealizacion: Date;

  @RequiredDate()
  fechaInicio: Date;

  @RequiredDate()
  fechaFinalizacion: Date;

  @OptionalText()
  observaciones?: string;

  @OptionalNumber({ min: 0 })
  costoManoObra?: number;

  @OptionalNumber({ min: 0 })
  costoRepuestos?: number;

  @OptionalNestedArray(() => AnexoItemDto, { maxSize: 10 })
  anexos?: AnexoItemDto[];

  @OptionalNested(() => EjecucionExternaEmbebidaDto)
  ejecucionExterna?: EjecucionExternaEmbebidaDto;
}

export class CreateReprogramacionActividadDto {
  @RequiredInteger({ min: 1 })
  equipoId: number;

  @RequiredEnum(TipoActividad)
  tipo: TipoActividad;

  @RequiredEnum(MotivoReprogramacionActividad)
  motivo: MotivoReprogramacionActividad;

  @RequiredDate()
  fechaReprogramada: Date;

  @OptionalText()
  motivoDetalle?: string;
}

export class FilterSumaryEstadosActividadByFechasDto {
  @OptionalDate()
  fechaInicio?: Date;

  @OptionalDate()
  fechaFin?: Date;

  @OptionalEnum(TipoActividad)
  tipo?: TipoActividad;
}

export class FilterRegistroActividadDto extends IntersectionType(
  FilterSumaryEstadosActividadByFechasDto,
  PaginationDto
) {
  @OptionalInteger({ min: 1 })
  equipoId?: number;

  @OptionalEnum(EstadoActividad)
  estado?: EstadoActividad;

  @OptionalEnum(NaturalezaIntervencionActividad)
  naturaleza?: NaturalezaIntervencionActividad;

  @OptionalBooleanQuery()
  revisado?: boolean;
}

export class FilterReporteActividadesDto {
  @OptionalDate()
  fechaInicio?: Date;

  @OptionalDate()
  fechaFin?: Date;

  @OptionalEnum(TipoActividad)
  tipo?: TipoActividad;

  @OptionalEnum(EstadoActividad)
  estado?: EstadoActividad;

  @OptionalInteger({ min: 1 })
  equipoId?: number;

  @OptionalEnum(OrigenActividad)
  origen?: OrigenActividad;

  @OptionalInteger({ min: 1 })
  page = 1;

  @OptionalInteger({ min: 1, max: 100 })
  limit = 20;
}

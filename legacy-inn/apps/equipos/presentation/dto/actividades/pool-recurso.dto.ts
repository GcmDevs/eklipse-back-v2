import {
  OptionalNested,
  OptionalText,
  RequiredEnum,
  RequiredInteger,
  RequiredText,
} from '@common/presentation/decorators';
import {
  MotivoAsignacionActividad,
  MotivoAsignacionRecursoUsuario,
  MotivoFinalizacionAsignacionActividad,
  MotivoFinalizacionAsignacionRecursoUsuario,
} from '@equipos/domain/enums';

export class CreateRecursoDto {
  @RequiredText({ maxLength: 150 })
  nombre: string;
}

export class MotivoAsignacionTecnicoRecursoDto {
  @RequiredEnum(MotivoAsignacionRecursoUsuario)
  motivo: MotivoAsignacionRecursoUsuario;

  @OptionalText({ maxLength: 400 })
  detalle?: string;

  @OptionalText()
  observaciones?: string;
}

export class MotivoFinalizacionAsignacionTecnicoRecursoDto {
  @RequiredEnum(MotivoFinalizacionAsignacionRecursoUsuario)
  motivo: MotivoFinalizacionAsignacionRecursoUsuario;

  @OptionalText({ maxLength: 400 })
  detalle?: string;
}

export class AssingUsuarioTecnicoRecursoDto {
  @RequiredInteger({ min: 1 })
  usuarioId: number;

  @OptionalNested(() => MotivoAsignacionTecnicoRecursoDto)
  motivoAsignacion?: MotivoAsignacionTecnicoRecursoDto;

  @OptionalNested(() => MotivoFinalizacionAsignacionTecnicoRecursoDto)
  motivoCambio?: MotivoFinalizacionAsignacionTecnicoRecursoDto;
}

export class MotivoAsignacionActividadDto {
  @RequiredEnum(MotivoAsignacionActividad)
  motivo: MotivoAsignacionActividad;

  @OptionalText({ maxLength: 400 })
  detalle?: string;
}

export class MotivoFinalizacionAsignacionActividadDto {
  @RequiredEnum(MotivoFinalizacionAsignacionActividad)
  motivo: MotivoFinalizacionAsignacionActividad;

  @OptionalText({ maxLength: 400 })
  detalle?: string;
}

export class AssingRecursoActividadDto {
  @RequiredInteger({ min: 1 })
  recursoId: number;

  @OptionalNested(() => MotivoAsignacionActividadDto)
  motivoAsignacion?: MotivoAsignacionActividadDto;

  @OptionalNested(() => MotivoFinalizacionAsignacionActividadDto)
  motivoCambio?: MotivoFinalizacionAsignacionActividadDto;

  @OptionalText({ maxLength: 600 })
  observaciones?: string;
}

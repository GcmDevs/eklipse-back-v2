import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { PlanActividad } from '@equipos/domain/entities';
import { ModoFormato, TipoActividad, TipoMantenimiento } from '@equipos/domain/enums';
import { CreatePlanActividadDto } from '@equipos/presentation/dto';
import { buildPeriocidad } from './build-periocidad.helper';

type FormatoOperativo = {
  getId: { getValor: number };
  getModo: ModoFormato;
};

type FormatoServiceLike = {
  findByIdAndTipo(
    id: number,
    tipo: TipoMantenimiento,
    options?: FindThrowOptions
  ): Promise<FormatoOperativo | null>;
};

export async function buildPlanActividad(
  formatoService: FormatoServiceLike,
  tipo: TipoActividad,
  data: CreatePlanActividadDto
): Promise<PlanActividad> {
  let formatoId: number | null = data.formatoId ?? null;

  if (tipo === TipoActividad.MANTENIMIENTO && data.formatoId) {
    const formato = await formatoService.findByIdAndTipo(
      data.formatoId,
      TipoMantenimiento.PREVENTIVO,
      { throwIfNotFound: false }
    );
    if (!formato) {
      throw new ResourceNotFoundError(
        `Formato de mantenimiento preventivo con id: ${data.formatoId} no encontrado`
      );
    }
    if (formato.getModo !== ModoFormato.OPERATIVO) {
      throw new BadInputError(
        'No se puede asociar el equipo a un formato tipo plantilla, solo a operativos'
      );
    }
    formatoId = formato.getId.getValor;
  }

  return PlanActividad.create(
    tipo,
    formatoId,
    buildPeriocidad(data.periocidad),
    data.fechaUltimaEjecucion ?? null,
    data.seRealizaPorExterno ?? false,
    data.diasAnticipacionNotificacion ?? null,
    data.origenInicializacion,
    data.observaciones
  );
}

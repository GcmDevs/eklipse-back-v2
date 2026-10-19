import { BadInputError } from '@common/domain/errors';
import { TipoActividad } from '@equipos/domain/enums';
import { PlanDefaultTipoEquipoRead } from '@equipos/domain/read';
import { CreatePlanActividadDto } from '@equipos/presentation/dto';

interface ConfiguracionPlanEquipoInput {
  usarPlanTipoEquipo?: boolean;
  plan?: CreatePlanActividadDto;
}

interface PlanCreacionEquipoResuelto {
  planDefaultId?: number;
  planPersonalizado?: CreatePlanActividadDto;
}

export function resolvePlanCreacionEquipo(
  config: ConfiguracionPlanEquipoInput | undefined,
  tipoPlan: TipoActividad,
  planesDefault: PlanDefaultTipoEquipoRead[]
): PlanCreacionEquipoResuelto {
  if (!config) return {};

  const usaTipoEquipo = config.usarPlanTipoEquipo === true;
  const planPersonalizado = config.plan;

  if (usaTipoEquipo && planPersonalizado) {
    throw new BadInputError(
      `Configuración inválida del plan de ${TipoActividad[tipoPlan].toLowerCase()}: no puede enviar usarPlanTipoEquipo en true y un plan personalizado al mismo tiempo`
    );
  }

  if (usaTipoEquipo) {
    const planDefault = planesDefault.find(p => p.tipo === tipoPlan);
    if (!planDefault) {
      throw new BadInputError(
        `El tipo de equipo no tiene plan default de ${TipoActividad[tipoPlan].toLowerCase()}`
      );
    }
    return { planDefaultId: planDefault.id };
  }

  if (planPersonalizado) {
    return { planPersonalizado };
  }

  return {};
}

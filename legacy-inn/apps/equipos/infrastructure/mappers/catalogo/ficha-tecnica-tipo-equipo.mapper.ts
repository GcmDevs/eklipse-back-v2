import { FichaTecnicaTipoEquipo } from '@equipos/domain/value-objects';
import { DatosCalibracion, DatosTecnicos, PeriodoDeTiempo, VariableCalibracion } from '@equipos/domain/value-objects';
import { Riesgo } from '@equipos/domain/enums';
import { FichaTecnicaTipoEquipoRead } from '@equipos/domain/read';
import { FichaTecnicaTipoEquipoEmbeddable, PeriodoTiempoEmbeddable, variableMedidaTransformer } from '@orm/inn/equipos';
import { ClasificacionBiomedicaMapper } from './clasif-biomedica.mapper';
import { DatosTecnicosMapper } from './datos-tec.mapper';

export class FichaTecnicaTipoEquipoMapper {
  private static resolveVariables(
    raw?: VariableCalibracion | string | null,
  ): VariableCalibracion | undefined {
    if (!raw) return undefined;
    if (raw instanceof VariableCalibracion) return raw;
    if (typeof raw === 'string') return variableMedidaTransformer.from(raw);
    return undefined;
  }

  static toDomain(orm?: FichaTecnicaTipoEquipoEmbeddable | null): FichaTecnicaTipoEquipo | undefined {
    if (!orm) return undefined;

    const variables = this.resolveVariables(orm.dtCalibVariables);

    return FichaTecnicaTipoEquipo.create(
      orm.datosTecnicos ? DatosTecnicosMapper.toDomain(orm.datosTecnicos) : undefined,
      orm.clasificacionBiomedica
        ? ClasificacionBiomedicaMapper.toDomain(orm.clasificacionBiomedica)
        : undefined,
      orm.vidaUtil?.valor != null && orm.vidaUtil?.unidad
        ? PeriodoDeTiempo.create(orm.vidaUtil.valor, orm.vidaUtil.unidad)
        : undefined,
      orm.reqCalibracion,
      variables ? DatosCalibracion.create(variables) : undefined,
      orm.dtCalibNormaAplicable,
    );
  }

  static toEmbeddable(domain?: FichaTecnicaTipoEquipo): FichaTecnicaTipoEquipoEmbeddable | undefined {
    if (!domain) return undefined;

    const embeddable = new FichaTecnicaTipoEquipoEmbeddable();
    embeddable.datosTecnicos = DatosTecnicosMapper.toOrm(domain.getDatosTecnicos);
    embeddable.clasificacionBiomedica = ClasificacionBiomedicaMapper.toOrm(
      domain.getClasificacionBiomedica,
    ) as any;

    if (domain.getVidaUtil) {
      const periodo = new PeriodoTiempoEmbeddable();
      periodo.unidad = domain.getVidaUtil.getUnidad;
      periodo.valor = domain.getVidaUtil.getValor;
      embeddable.vidaUtil = periodo;
    }

    embeddable.reqCalibracion = domain.getReqCalibracion;

    const variables = domain.getDtCalib?.getVariables;
    embeddable.dtCalibVariables = variables
      ? (variableMedidaTransformer.to(variables) as unknown as VariableCalibracion)
      : undefined;

    embeddable.dtCalibNormaAplicable = domain.getDtCalibNormaAplicable;
    return embeddable;
  }

  static calibVariablesToView(
    raw?: VariableCalibracion | string | null,
  ): { tipo: string; nombre?: string }[] | null {
    const variables = this.resolveVariables(raw);
    return variables ? variables.getAll() : null;
  }

  static toView(orm?: FichaTecnicaTipoEquipoEmbeddable | null): FichaTecnicaTipoEquipoRead | null {
    if (!orm) return null;

    const variables = this.calibVariablesToView(orm.dtCalibVariables);
    const medidasRaw = orm.datosTecnicos?.medidas;
    const medidas = medidasRaw
      ? (typeof (medidasRaw as any).getAll === 'function'
        ? (medidasRaw as any).getAll()
        : medidasRaw)
      : null;

    return {
      vidaUtil: orm.vidaUtil?.valor != null && orm.vidaUtil?.unidad
        ? { valor: orm.vidaUtil.valor, unidad: orm.vidaUtil.unidad }
        : null,
      reqCalibracion: orm.reqCalibracion ?? false,
      datosTecnicos: medidas
        ? { medidas: Array.isArray(medidas) ? medidas : [] }
        : null,
      datosCalibracion: variables?.length
        ? { variables }
        : null,
      dtCalibNormaAplicable: orm.dtCalibNormaAplicable ?? null,
      clasificacion: orm.clasificacionBiomedica
        ? {
          aplicaRegSanitario: orm.clasificacionBiomedica.aplicaRegSanitario ?? false,
          numeroRegSanitario: orm.clasificacionBiomedica.numeroRegSanitario ?? null,
          expedienteRegSanitario: orm.clasificacionBiomedica.expedienteRegSanitario ?? null,
          prevencion: orm.clasificacionBiomedica.prevencion ?? false,
          diagnostico: orm.clasificacionBiomedica.diagnostico ?? false,
          rehabilitacion: orm.clasificacionBiomedica.rehabilitacion ?? false,
          tratamientoMantenimientoDeVida: orm.clasificacionBiomedica.tratamientoMantenimientoDeVida ?? false,
          analisisLaboratorio: orm.clasificacionBiomedica.analisisLaboratorio ?? false,
          riesgo: (orm.clasificacionBiomedica.riesgo ?? Riesgo.NO_APLICA) as Riesgo,
        }
        : null,
    };
  }
}

import { DatosCalibracion } from '@equipos/domain/value-objects';
import { DatosCalibracionEmbeddable } from '@orm/inn/equipos/supports';

export class DatosCalibracionMapper {
  static toOrm(domain: DatosCalibracion): DatosCalibracionEmbeddable {
    const orm = new DatosCalibracionEmbeddable();

    const variables = domain.getVariables;
    orm.variables = variables ? (JSON.stringify(variables.toPrimitives()) as any) : null;
    orm.codigoUltimaCalibracion = domain.getCodigoUltimaCalibracion ?? null;

    return orm;
  }

  static toDomain(orm: DatosCalibracionEmbeddable): DatosCalibracion {
    return DatosCalibracion.create(orm.variables, orm.codigoUltimaCalibracion);
  }
}

import { UnidadMedida } from '@equipos/domain/entities';
import { ResponseUnidadMedidaDto } from '@equipos/presentation/dto';
import { UnidadMedidaOrm } from '@orm/inn/equipos';

export class UnidadMedidaMapper {
  static toOrm(domain: UnidadMedida): UnidadMedidaOrm {
    const orm = new UnidadMedidaOrm();
    orm.id = domain.getId.getValor ?? undefined;
    orm.nombre = domain.getNombre;
    orm.simbolo = domain.getSimbolo;
    orm.esBase = domain.getEsBase;
    return orm;
  }

  static toDomain(orm: UnidadMedidaOrm): UnidadMedida {
    return UnidadMedida.rebuild(orm.id, orm.nombre, orm.simbolo, orm.esBase);
  }

  static toResponse(domain: UnidadMedida): ResponseUnidadMedidaDto {
    return {
      id: domain.getId.getValor,
      nombre: domain.getNombre,
      simbolo: domain.getSimbolo,
      esBase: domain.getEsBase,
    };
  }
}

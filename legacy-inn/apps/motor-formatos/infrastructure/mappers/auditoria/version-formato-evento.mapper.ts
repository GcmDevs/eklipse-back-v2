import { VersionFormatoEvento } from 'apps/motor-formatos/domain/entities/auditoria';
import { EventoAuditVersionFormatoOrm } from '../../persistence/orm/auditoria';

export class VersionFormatoEventoMapper {
  static toOrm(domain: VersionFormatoEvento): EventoAuditVersionFormatoOrm {
    const orm = new EventoAuditVersionFormatoOrm();

    orm.id = domain.getId.getValor ?? undefined;
    orm.versionFormatoId = domain.getVersionFormatoId.getValor;
    orm.tipoEvento = domain.getTipoEvento;
    orm.usuarioId = domain.getUsuarioId.getValor;
    orm.createdAt = domain.getCratedAt;

    return orm;
  }

  static toDomain(orm: EventoAuditVersionFormatoOrm): VersionFormatoEvento {
    return VersionFormatoEvento.rebuild(
      orm.id,
      orm.versionFormatoId,
      orm.tipoEvento,
      orm.usuarioId,
      orm.createdAt
    );
  }
}

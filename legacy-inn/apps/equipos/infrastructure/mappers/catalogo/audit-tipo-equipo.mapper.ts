import { AuditTipoEquipo } from '@equipos/domain/entities/catalogo/audit-tipo-equipo.entity';
import { AuditTipoEquipoRead } from '@equipos/domain/read';
import { AuditTipoEquipoOrm } from '@orm/inn/equipos/catalogo/audit-tipo-equipo.orm';

export class AuditTipoEquipoMapper {
  static toOrm(domain: AuditTipoEquipo): AuditTipoEquipoOrm {
    return AuditTipoEquipoOrm.create({
      tipoEquipoId: domain.getTipoEquipoId.getValor,
      tipo: domain.getTipo,
      campo: domain.getCampo,
      valorAnterior: domain.getValorAnterior,
      valorNuevo: domain.getValorNuevo,
      sincronizo: domain.getSincronizo,
      usuarioId: domain.getUsuarioId.getValor,
      usuarioNombre: domain.getUsuarioNombre,
      fechaCambio: domain.getFechaCambio,
      observaciones: domain.getObservaciones,
      correlationOid: domain.getCorrelationOid,
      createdAt: domain.getCreatedAt,
    });
  }

  static toDomain(orm: AuditTipoEquipoOrm): AuditTipoEquipo {
    return AuditTipoEquipo.rebuild({
      id: orm.id,
      tipoEquipoId: orm.tipoEquipoId,
      tipo: orm.tipo,
      campo: orm.campo ?? null,
      valorAnterior: orm.valorAnterior ?? null,
      valorNuevo: orm.valorNuevo ?? null,
      sincronizo: orm.sincronizo,
      usuarioId: orm.usuarioId,
      usuarioNombre: orm.usuarioNombre,
      fechaCambio: orm.fechaCambio,
      observaciones: orm.observaciones ?? null,
      correlationOid: orm.correlationOid,
      createdAt: orm.createdAt,
    });
  }

  static toView(orm: AuditTipoEquipoOrm): AuditTipoEquipoRead {
    return {
      id: orm.id,
      tipoEquipoId: orm.tipoEquipoId,
      tipo: orm.tipo,
      campo: orm.campo ?? null,
      valorAnterior: orm.valorAnterior ?? null,
      valorNuevo: orm.valorNuevo ?? null,
      sincronizo: orm.sincronizo,
      usuarioId: orm.usuarioId,
      usuarioNombre: orm.usuarioNombre,
      fechaCambio: orm.fechaCambio,
      observaciones: orm.observaciones ?? null,
      correlationOid: orm.correlationOid,
      createdAt: orm.createdAt,
    };
  }

  static toViewList(orms: AuditTipoEquipoOrm[]): AuditTipoEquipoRead[] {
    return orms.map(orm => this.toView(orm));
  }
}

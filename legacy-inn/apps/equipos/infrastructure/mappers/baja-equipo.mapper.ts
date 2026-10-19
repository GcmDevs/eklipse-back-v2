import { EquipoBaja } from '@equipos/domain/entities';
import { EquipoBajaRead } from '@equipos/domain/read';
import { ArchivoAlmacenadoOrm } from '@orm/cor';
import { EquipoBajaOrm, EquipoOrm } from '@orm/inn/equipos';

export class EquipoBajaMapper {
  static toOrm(domain: EquipoBaja): EquipoBajaOrm {
    const orm = new EquipoBajaOrm();

    if (domain.getId.getValor) {
      orm.id = domain.getId.getValor;
    }

    orm.equipo = {
      id: domain.getEquipoId.getValor,
    } as EquipoOrm;

    orm.archivoActa = {
      id: domain.getArchivoActaId.getValor,
    } as ArchivoAlmacenadoOrm;

    orm.motivo = domain.getMotivo;

    orm.usuarioResponsableId = domain.getUsuarioId.getValor;

    orm.fechaBaja = domain.getFechaBaja;

    orm.createdAt = domain.getCreatedAt;

    orm.observaciones = domain.getObservaciones;
    return orm;
  }

  static toDomain(orm: EquipoBajaOrm): EquipoBaja {
    return EquipoBaja.rebuild(
      orm.id,
      orm.equipo.id,
      orm.archivoActa.id,
      orm.motivo,
      orm.usuarioResponsableId,
      orm.fechaBaja,
      orm.createdAt,
      orm.observaciones
    );
  }

  static toView(orm: EquipoBajaOrm): EquipoBajaRead {
    return {
      id: orm.id,
      motivo: orm.motivo,
      fechaBaja: orm.fechaBaja,
      archivoActaId: orm.archivoActa.id,
      usuarioResponsableId: orm.usuarioResponsableId,
      observaciones: orm?.observaciones,
    };
  }
}

import { LecturaOdometro } from '@inn/operaciones/tanqueos/domain/entities';
import { LecturaOdometroRead } from '@inn/operaciones/tanqueos/domain/reads/lectura-odometro.read';
import { LecturaOdometroOrm } from '../persistence/orm';

export class LecturaOdometroMapper {
  static toDomain(orm: LecturaOdometroOrm): LecturaOdometro {
    return LecturaOdometro.rebuild(
      orm.id,
      orm.activoId,
      orm.lectura,
      orm.fechaLectura,
      orm.fuente,
      orm.referenciaId ?? null,
      orm.confiable,
      orm.usuario?.id ?? 0,
      orm.observacion ?? null,
      orm.createdAt
    );
  }

  static toOrm(domain: LecturaOdometro): LecturaOdometroOrm {
    const orm = new LecturaOdometroOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.activoId = domain.getActivoId.getValor;
    orm.lectura = domain.getLectura;
    orm.fechaLectura = domain.getFechaLectura;
    orm.fuente = domain.getFuente;
    orm.referenciaId = domain.getReferenciaId?.getValor;
    orm.confiable = domain.getConfiable;
    orm.usuario = { id: domain.getUsuarioId.getValor } as LecturaOdometroOrm['usuario'];
    orm.observacion = domain.getObservacion;
    orm.createdAt = domain.getCreatedAt;
    return orm;
  }

  static toView(orm: LecturaOdometroOrm): LecturaOdometroRead {
    return {
      id: orm.id,
      activoId: orm.activoId,
      lectura: orm.lectura,
      fechaLectura: orm.fechaLectura,
      fuente: orm.fuente,
      referenciaId: orm.referenciaId ?? null,
      confiable: orm.confiable,
      usuarioId: orm.usuario?.id ?? 0,
      usuarioNombre: orm.usuario?.nombreCompleto,
      observacion: orm.observacion ?? null,
      createdAt: orm.createdAt,
    };
  }

  static toViewList(orms: LecturaOdometroOrm[]): LecturaOdometroRead[] {
    return orms.map((orm) => this.toView(orm));
  }
}

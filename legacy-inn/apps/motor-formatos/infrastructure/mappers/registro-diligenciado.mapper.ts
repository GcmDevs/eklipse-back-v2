import {
  RegistroDiligenciadoFmt,
  RegistroDiligenciadoFmtRead,
  RegistroImagen,
} from 'apps/motor-formatos/domain';
import { RegistroDiligenciadoFmtOrm } from '../persistence';

export class RegistroDiligenciadoMapper {
  static toOrm(domain: RegistroDiligenciadoFmt): RegistroDiligenciadoFmtOrm {
    const orm = new RegistroDiligenciadoFmtOrm();

    orm.id = domain.getId.getValor ?? undefined;
    orm.versionFormatoId = domain['versionFormatoId'].getValor;
    orm.formatoId = domain['formatoId'].getValor;
    orm.equipoId = domain['equipoId'].getValor;
    orm.datoSnapshot = domain['datoSnapshot'] ?? {};

    orm.imagenes = domain.getImagenes.map(i => ({
      key: i.getKey,
      archivoId: i.getArchivoId,
    }));

    orm.diligenciadoPorId = domain.getDiligenciadoPorId;
    orm.registroActividadId = domain.getRegistroActividadId.getValor;
    orm.fechaEnvio = domain['fechaEnvio'];
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toDomain(orm: RegistroDiligenciadoFmtOrm): RegistroDiligenciadoFmt {
    const imagenes: RegistroImagen[] =
      orm.imagenes?.map(i => new RegistroImagen(i.key, i.archivoId)) ?? [];

    return RegistroDiligenciadoFmt.rebuild(
      orm.id,
      orm.versionFormatoId,
      orm.formatoId,
      orm.equipoId,
      orm.registroActividadId,
      orm.diligenciadoPorId,
      orm.datoSnapshot,
      imagenes,
      orm.estado,
      orm.fechaEnvio,
      orm.fechaCompletado,
      orm.createdAt,
      orm.updatedAt
    );
  }

  static toView(orm: RegistroDiligenciadoFmtOrm): RegistroDiligenciadoFmtRead {
    return {
      id: orm.id,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      versionFormatoId: orm.versionFormatoId,
      formatoId: orm.formatoId,
      estado: orm.estado,
      equipoId: orm.equipoId,
      registroActividadId: orm.registroActividadId,
      datoSnapshot: orm.datoSnapshot,
      imagenes: orm.imagenes,
      diligenciadoPorId: orm.diligenciadoPorId,
      fechaEnvio: orm.fechaEnvio,
    };
  }

  static toDomainList(ormList: RegistroDiligenciadoFmtOrm[]): RegistroDiligenciadoFmt[] {
    return ormList.map(this.toDomain);
  }
}

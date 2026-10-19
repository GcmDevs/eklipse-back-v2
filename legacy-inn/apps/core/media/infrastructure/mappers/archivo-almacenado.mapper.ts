import { ArchivoAlmacenadoRead } from '@core/media/domain/read/media.read';
import { ArchivoAlmacenadoOrm } from '@orm/cor';
import { ArchivoAlmacenado } from '../../domain/entities/archivo-almacenado.entity';

export class ArchivoAlmacenadoMapper {
  static toOrm(domain: ArchivoAlmacenado): ArchivoAlmacenadoOrm {
    const orm = new ArchivoAlmacenadoOrm();

    orm.id = domain.getId.getValor ?? undefined;

    orm.nombreOriginal = domain.getNombreOriginal;
    orm.nombreDeAlmacenado = domain.getNombreAlmacenado;
    orm.extension = domain.getExtension;
    orm.tipoMime = domain.getTipoMime;
    orm.tamanoBytes = domain.getTamanoBytes;
    orm.rutaArchivo = domain.getRutaArchivo;
    orm.rutaSegura = domain.getRutaSegura;
    orm.proveedorAlmacenamiento = domain.getProveedorAlmacenamiento;
    orm.isTemporal = domain.getIsTemporal;
    orm.isUsado = domain.getIsUsado;
    orm.contexto = domain?.getContexto;
    orm.referenciaId = domain.getReferenciaId?.getValor;
    orm.usuarioCargaId = domain?.getUsuarioCargaId?.getValor;
    orm.fechaCarga = domain?.getFechaCarga;

    return orm;
  }

  static toUpdateOrm(domain: ArchivoAlmacenado): Partial<ArchivoAlmacenadoOrm> {
    return {
      nombreOriginal: domain.getNombreOriginal,
      nombreDeAlmacenado: domain.getNombreAlmacenado,
      extension: domain.getExtension,
      tipoMime: domain.getTipoMime,
      tamanoBytes: domain.getTamanoBytes,
      rutaArchivo: domain.getRutaArchivo,
      rutaSegura: domain.getRutaSegura,
      proveedorAlmacenamiento: domain.getProveedorAlmacenamiento,
      isTemporal: domain.getIsTemporal,
      isUsado: domain.getIsUsado,
      contexto: domain.getContexto,
      referenciaId: domain.getReferenciaId?.getValor,
      usuarioCargaId: domain.getUsuarioCargaId?.getValor,
      fechaCarga: domain.getFechaCarga,
    };
  }

  static toDomain(orm: ArchivoAlmacenadoOrm): ArchivoAlmacenado {
    return ArchivoAlmacenado.rebuild(
      orm.id,
      orm.nombreOriginal,
      orm.nombreDeAlmacenado,
      orm.extension,
      orm.tipoMime,
      orm.tamanoBytes,
      orm.rutaArchivo,
      orm.rutaSegura ?? null,
      orm.contexto,
      orm.referenciaId,
      orm.proveedorAlmacenamiento,
      orm.isTemporal,
      orm.isUsado,
      orm.fechaCarga,
      orm?.usuarioCargaId
    );
  }

  static toView(orm: ArchivoAlmacenadoOrm): ArchivoAlmacenadoRead {
    return {
      id: orm.id,
      nombreOriginal: orm.nombreOriginal,
      tipoMime: orm.tipoMime.toString(),
      extension: orm.extension,
      tamanoBytes: orm.tamanoBytes,
    };
  }

  static toViewList(orms: ArchivoAlmacenadoOrm[]): ArchivoAlmacenadoRead[] {
    return orms.map(this.toView);
  }

  static toDomainList(ormList: ArchivoAlmacenadoOrm[]): ArchivoAlmacenado[] {
    return ormList.map(this.toDomain);
  }

  static toOrmList(domainList: ArchivoAlmacenado[]): ArchivoAlmacenadoOrm[] {
    return domainList.map(this.toOrm);
  }
}

import { Compra } from '@equipos/domain/entities/compra.entity';
import { CompraRead } from '@equipos/domain/read';
import { CompraOrm } from '@orm/inn/equipos/adquisicion/compra.orm';

export class CompraMapper {
  static toDomain(orm: CompraOrm): Compra {
    return Compra.rebuild(
      orm.id,
      orm.codigo,
      orm.fechaCompra,
      orm.tipoAdquisicion,
      orm.proveedor?.id,
      orm.proveedorSnap ?? orm.proveedor?.nombre ?? orm.proveedor?.codigo ?? '',
      orm.createdAt,
      orm.updatedAt,
      orm.numFactura,
      orm.fechaFactura,
      orm.fechaFabricacion,
      orm.aplicaGarantia,
      orm.fechVencGarantia,
      orm.fabricante?.id,
      orm.distribuidor?.id,
      orm.fabricanteSnap ?? orm.fabricante?.nombre,
      orm.distribuidorSnap ?? orm.distribuidor?.nombre,
      orm.observaciones
    );
  }

  static toOrm(domain: Compra): CompraOrm {
    const orm = new CompraOrm();
    if (domain.getId.getValor) orm.id = domain.getId.getValor;
    orm.codigo = domain.getCodigo;
    orm.fechaCompra = domain.getFechaCompra;
    orm.tipoAdquisicion = domain.getTipoAdquisicion;
    orm.numFactura = domain.getNumFactura;
    orm.fechaFactura = domain.getFechaFactura;
    orm.fechaFabricacion = domain.getFechaFabricacion;
    orm.aplicaGarantia = domain.getAplicaGarantia;
    orm.fechVencGarantia = domain.getFechVencGarantia;
    orm.proveedor = { id: domain.getProveedorId.getValor } as any;
    orm.proveedorSnap = domain.getProveedorSnap;
    if (domain.getFabricanteId) {
      orm.fabricante = { id: domain.getFabricanteId.getValor } as any;
    }
    orm.fabricanteSnap = domain.getFabricanteSnap;
    if (domain.getDistribuidorId) {
      orm.distribuidor = { id: domain.getDistribuidorId.getValor } as any;
    }
    orm.distribuidorSnap = domain.getDistribuidorSnap;
    orm.observaciones = domain.getObservaciones;
    orm.createdAt = domain.getCreatedAt;
    orm.updatedAt = domain.getUpdatedAt;
    return orm;
  }

  static toView(orm: CompraOrm): CompraRead {
    return {
      id: orm.id,
      codigo: orm.codigo,
      fechaCompra: orm.fechaCompra,
      tipoAdquisicion: orm.tipoAdquisicion,
      proveedorId: orm.proveedor?.id,
      proveedorNombre: orm.proveedorSnap ?? orm.proveedor?.nombre ?? orm.proveedor?.codigo,
      numFactura: orm.numFactura,
      fechaFactura: orm.fechaFactura,
      fechaFabricacion: orm.fechaFabricacion,
      aplicaGarantia: orm.aplicaGarantia,
      fechVencGarantia: orm.fechVencGarantia,
      documentos: (orm.documentos ?? []).map(d => ({
        id: d.id,
        tipoEquipoId: d.tipoEquipo?.id ?? orm.id,
        tipoDocumentoId: d.tipoDocumento?.id,
        tipoDocumentoNombre: d.tipoDocumento?.nombre,
        tipoDocumentoCategoria: d.tipoDocumento?.categoria,
        aplica: d.aplica,
        archivoId: d.archivo?.id ?? null,
        observaciones: d.observaciones,
        activo: d.activo ?? true,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      fabricanteId: orm.fabricante?.id,
      fabricanteNombre: orm.fabricanteSnap ?? orm.fabricante?.nombre,
      distribuidorId: orm.distribuidor?.id,
      distribuidorNombre: orm.distribuidorSnap ?? orm.distribuidor?.nombre,
      observaciones: orm.observaciones,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    };
  }

  static toViewList(orms: CompraOrm[]): CompraRead[] {
    return orms.map(this.toView);
  }
}

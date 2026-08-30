import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { ProveedorOrm, UsuarioOrm } from '@inn/lgc/ctc/orm/gen';
import { BaseSource } from '@common/infrastructure/services';
import {
  EstadoCode,
  EstadoEspecificoCode,
} from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { CambioEstadoOrm, SolicitudOrm } from '@inn/lgc/ctc/orm/inn/central-compras';
import { ProductoOrm } from '@inn/lgc/ctc/orm/inn/productos';

@Injectable()
export class CotizacionPrefabricadaBaseSource extends BaseSource {
  protected async createCambioEstado(payload: {
    estadoEspecificoCode: EstadoEspecificoCode;
    estadoCode: EstadoCode;
    solicitud: SolicitudOrm;
    archivoRelacionado?: string;
    cedulaUsuario?: string;
    entidadRelacionadaId?: number;
    informacionAdicional?: string;
    upperCase?: boolean;
  }) {
    payload.upperCase =
      [null, undefined].indexOf(payload.upperCase) >= 0 ? true : payload.upperCase;
    const userRp = this.qr.manager.getRepository(UsuarioOrm);
    const cambioEstadoRp = this.qr.manager.getRepository(CambioEstadoOrm);

    const userFromDb = await userRp.findOne({
      where: { cedula: payload.cedulaUsuario ? payload.cedulaUsuario : this.auth.user.document },
      select: {
        id: true,
        cedula: true,
        nombreCompleto: true,
      },
    });

    const informacionAdicional = payload.informacionAdicional
      ? payload.informacionAdicional.trim()
      : payload.informacionAdicional;

    const informacionAdicionalFt =
      payload.upperCase && informacionAdicional
        ? informacionAdicional.toUpperCase()
        : informacionAdicional;

    const newCambioEstado = new CambioEstadoOrm();
    newCambioEstado.tipoCode = payload.estadoCode;
    newCambioEstado.keyCode = payload.estadoEspecificoCode;
    newCambioEstado.informacionAdicional = informacionAdicionalFt;
    newCambioEstado.solicitudId = payload.solicitud.id;
    newCambioEstado.entidadRelacionadaId = payload.entidadRelacionadaId;
    newCambioEstado.usuario = userFromDb;
    newCambioEstado.archivoRelacionado = payload.archivoRelacionado;
    newCambioEstado.createdAt = new Date();

    const cambioEstadoStored = cambioEstadoRp.save(newCambioEstado);

    return cambioEstadoStored;
  }

  public async verifyProveedores(proveedoresIds: number[]): Promise<ProveedorOrm[]> {
    const proveedorRp = this.qr.manager.getRepository(ProveedorOrm);

    const proveedores = await proveedorRp.find({
      where: { id: In(proveedoresIds) },
    });

    proveedoresIds.forEach(pi => {
      const proveedorFiltered = proveedores.filter(p => p.id === pi);
      if (!proveedorFiltered.length) throw new Error(`El proveedor con id #${pi} no existe`);
    });

    return proveedores;
  }

  public async verifyProductos(productosIds: number[]): Promise<ProductoOrm[]> {
    const productoRp = this.qr.manager.getRepository(ProductoOrm);

    const productos = await productoRp.find({
      where: { id: In(productosIds) },
    });

    productosIds.forEach(pi => {
      const productosFiltered = productos.filter(p => p.id === pi);
      if (!productosFiltered.length) throw new Error(`El producto con id #${pi} no existe`);
    });

    return productos;
  }
}

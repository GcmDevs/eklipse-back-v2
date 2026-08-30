import { QueryRunner } from 'typeorm';
import { Injectable } from '@nestjs/common';
import {
  TIPOS,
  TipoCode,
  EstadoCode,
  EstadoEspecificoCode,
} from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { CambioEstadoOrm, SolicitudOrm } from '@inn/lgc/ctc/orm/inn/central-compras';
import { BaseSource } from '@common/infrastructure/services';
import { TipoDocumentoCode } from '@inn/lgc/ctc/types/inn/documentos';
import { centralComprasValidations } from './validations';
import { ProveedorOrm, UsuarioOrm } from '@inn/lgc/ctc/orm/gen';
import { ProductoOrm } from '@inn/lgc/ctc/orm/inn/productos';
import { TimerService } from './timer/timer';

@Injectable()
export class _PrivCentralComprasBaseSource extends BaseSource {
  /** @deprecated Pertenece a la versión original */
  protected validationsDeprecated(userCodeAuthorities: string[]) {
    return centralComprasValidations(userCodeAuthorities);
  }

  /** @deprecated Pertenece a la versión original */
  protected async createCambioEstadoDeprecated(
    qr: QueryRunner,
    payload: {
      estadoEspecificoCode: EstadoEspecificoCode;
      estadoCode: EstadoCode;
      solicitud: SolicitudOrm;
      archivoRelacionado?: string;
      entidadRelacionadaId?: number;
      informacionAdicional?: string;
      upperCase?: boolean;
    }
  ) {
    payload.upperCase =
      [null, undefined].indexOf(payload.upperCase) >= 0 ? true : payload.upperCase;
    const userRp = qr.manager.getRepository(UsuarioOrm);
    const cambioEstadoRp = qr.manager.getRepository(CambioEstadoOrm);

    const userFromDb = await userRp.findOne({
      where: { cedula: this.auth.user.document },
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

  protected createFakeProducto(descripcion: string, payload?: { marca?: string }) {
    const newFake = new ProductoOrm();
    newFake.id = null;
    newFake.codigo = 'N/A';
    newFake.descripcion = descripcion;
    newFake.marca = payload?.marca || null;
    newFake.precioSugerido = 0;

    return newFake;
  }

  protected createFakeProveedor(descripcion: string) {
    const newFake = new ProveedorOrm();
    newFake.id = null;
    newFake.codigo = 'N/A';
    newFake.nombre = descripcion;
    return newFake;
  }

  protected keyWordsTipoOrden(tipo: TipoCode) {
    const tipoDocumento: TipoDocumentoCode =
      tipo === TIPOS.PRODUCTOS.getCode() ? 0 : tipo === TIPOS.SERVICIOS.getCode() ? 19 : 0;

    const tipoOrden =
      tipoDocumento === 0 ? 'compra' : tipoDocumento === 19 ? 'servicio' : undefined;

    const tipoOrdenAbr = tipoDocumento === 0 ? 'OC' : tipoDocumento === 19 ? 'OS' : undefined;

    return {
      tipoDocumento,
      tipoOrden,
      tipoOrdenAbr,
    };
  }

  get timer() {
    return new TimerService();
  }
}

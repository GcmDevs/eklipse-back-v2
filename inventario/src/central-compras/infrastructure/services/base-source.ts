import { BaseSource } from '@common/infrastructure/services';
import { UsuarioOrm } from '@inn/orm/gen';
import { CambioEstadoOrm, SolicitudOrm } from '@inn/orm/inn/central-compras';
import {
  EstadoEspecificoType,
  EstadoType,
  TipoCode,
  TIPOS,
} from '@inn/types/inn/central-compras/solicitudes';
import { TipoDocumentoCode } from '@inn/types/inn/documentos';
import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';

export interface CreateCambioEstadoI {
  estado: EstadoType;
  estadoEspecifico: EstadoEspecificoType;
  solicitud: SolicitudOrm;
  archivoRelacionado?: string;
  entidadRelacionadaId?: number;
  informacionAdicional?: string;
  upperCase?: boolean;
}

@Injectable()
export class CentralComprasSource extends BaseSource {
  protected async createCambioEstado(qr: QueryRunner, pl: CreateCambioEstadoI) {
    pl.upperCase = [null, undefined].indexOf(pl.upperCase) >= 0 ? true : pl.upperCase;
    const cambioEstadoRp = qr.manager.getRepository(CambioEstadoOrm);
    const userRp = qr.manager.getRepository(UsuarioOrm);
    const userFromDDBB = await userRp.findOne({ where: { cedula: this.auth.user.document } });
    let informacionAdicional = pl.informacionAdicional?.trim();
    if (pl.upperCase) informacionAdicional = pl.informacionAdicional?.toUpperCase();
    const newE = new CambioEstadoOrm();
    newE.usuarioId = userFromDDBB.id;
    newE.solicitudId = pl.solicitud.id;
    newE.entidadRelacionadaId = pl.entidadRelacionadaId;
    newE.tipoCode = pl.estado.getCode();
    newE.keyCode = pl.estadoEspecifico.getCode();
    newE.informacionAdicional = informacionAdicional;
    newE.archivoRelacionado = pl.archivoRelacionado;
    newE.createdAt = new Date();
    const saved = await cambioEstadoRp.save(newE);
    saved.usuario = userFromDDBB;
    return saved;
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
}

import { QueryRunner } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { _PrivCentralComprasBaseSource } from './_priv-ctc.source';
import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';
import { CreateCambioEstadoI } from '@inn/lgc/ctc/application/interfaces';
import { fetchAuthsByUser, switchConn } from '@common/infrastructure/services';
import { CambioEstadoOrm } from '@inn/lgc/ctc/orm/inn/central-compras';
import { centralComprasValidations } from './validations';
import { UsuarioOrm } from '@inn/lgc/ctc/orm/gen';
import { INN_AUTHORITIES } from '@inn/authorities';
import { _PrivSecUserDependenceOrm } from '@common/infrastructure/orm/user-dependence.orm';

@Injectable()
export class CentralComprasSource extends _PrivCentralComprasBaseSource {
  protected async ctcPermisos(id?: number, ctx?: GcmContextType) {
    if (!id) id = this.auth.id;
    if (!ctx) ctx = this.auth.context;
    const userCodeAuthorities = await fetchAuthsByUser({ id, ctx });
    return centralComprasValidations(userCodeAuthorities.onlyCodes);
  }

  protected async canSeeAllSolicitudes() {
    return await this.hasAnyAuthority([
      INN_AUTHORITIES.CENTRAL_COMPRAS.VER_TODAS,
      INN_AUTHORITIES.CENTRAL_COMPRAS.VER_INCL_FORBIDDEN_VALUES,
    ]);
  }

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

  protected get centralCompras() {
    return { ctx: GCM_CONTEXTS.AMMEDICAL, authInCtC: this.auth.context === GCM_CONTEXTS.AMMEDICAL };
  }
}

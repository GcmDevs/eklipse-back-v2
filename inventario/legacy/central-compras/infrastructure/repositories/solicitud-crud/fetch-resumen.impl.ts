import { Injectable } from '@nestjs/common';
import { Between, DataSource, In, Like, Not } from 'typeorm';
import {
  CambioEstadoOrm,
  DetalleCotizacionOrm,
  SolicitudOrm,
} from '@inn/lgc/ctc/orm/inn/central-compras';
import {
  ESTADOS,
  ESTADOS_ESPECIFICOS,
  TipoCode,
  TIPOS,
} from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import {
  UltimoCambioEstadoBySolicitudI,
  ultimosCambiosEstadosBySolicitudQr,
} from '@inn/lgc/ctc/infrastructure/queries';
import { solicitudOrmToBasicInfoSolicitudRes } from '../../factories';
import { BasicInfoSolicitudRes } from '@inn/lgc/ctc/infrastructure/responses';
import { GcmContextType } from '@common/domain/types';
import {
  CARGADA_BY_COLABORADOR_CODES,
  CTXS_CLINICAS_VALIDAS,
  ROL_DEPENDIENTES_CODES,
  SOLICITUDES_INVALIDAS_CODES,
} from '@inn/lgc/ctc/application/constants';
import { CentralComprasSource } from '@inn/lgc/ctc/infrastructure/base';
import { ProductoOrm as AfnProductoOrm } from '@inn/lgc/ctc/orm/inn/activos-fijos';
import { ProductoOrm as InnProductoOrm } from '@inn/lgc/ctc/orm/inn/productos';
import { orderBy } from 'lodash';
import { generateBetweenDates } from '@inn/lgc/ctc/application/services';
import { INN_AUTHORITIES } from '@inn/authorities';

@Injectable()
export class FetchResumenSolicitudesImpl extends CentralComprasSource {
  canAprobarCotizacionRecomendada = !this.centralCompras.authInCtC
    ? false
    : this.hasAnyAuthority(
        [INN_AUTHORITIES.CENTRAL_COMPRAS.APRO_RECH_COTI_RECOMEN],
        undefined,
        this.auth.user.document,
        this.centralCompras.ctx
      );

  public async execute(start: Date, end: Date, tipos: TipoCode[]) {
    let ctxs = [this.auth.context];
    const canSeeAllSolicitudes = await this.canSeeAllSolicitudes();

    if (this.centralCompras.authInCtC && canSeeAllSolicitudes) ctxs = CTXS_CLINICAS_VALIDAS;
    const dates = generateBetweenDates(start, end);
    const res: BasicInfoSolicitudRes[] = [];

    for (let i = 0; i < ctxs.length; i++) {
      const ctx = ctxs[i];
      const conn = this.dynamicConn(ctx);
      const solicitudRp = conn.getRepository(SolicitudOrm);
      const conditions = {
        usuarioId: !canSeeAllSolicitudes ? this.auth.id : undefined,
        tipoCode: In(tipos),
        isDeleted: false,
      };

      const solicitudes = await solicitudRp.find({
        where: [
          { ...conditions, createdAt: Between(dates.start, dates.end) },
          { ...conditions, estadoCode: Not(In(SOLICITUDES_INVALIDAS_CODES)), isFinished: false },
        ],
        select: { id: true, usuarioId: true, estadoCode: true, dependenciaId: true },
      });

      const myUserInThisCentro = await this.fetchUserByDocument(this.auth.user.document, ctx);
      const dependenciasByUser = await this.fetchUserDependences(myUserInThisCentro.id, ctx);

      const solicitudesIds: number[] = [];
      solicitudes.map(s => {
        if (
          CARGADA_BY_COLABORADOR_CODES.indexOf(s.estadoCode) >= 0 &&
          s.usuarioId !== myUserInThisCentro.id
        ) {
          dependenciasByUser.forEach(dependenciaByUser => {
            if (dependenciaByUser.dependence.id === s.dependenciaId) {
              if (ROL_DEPENDIENTES_CODES.indexOf(dependenciaByUser.role.code) >= 0)
                solicitudesIds.push(s.id);
            }
          });
        } else {
          solicitudesIds.push(s.id);
        }
      });

      if (!this.centralCompras) {
        try {
          const key = 'REASIGNADA A AMMEDICAL';
          const cambioEstadoRp = conn.getRepository(CambioEstadoOrm);
          const reasignadosToAMMedicalIds = (
            await cambioEstadoRp.find({
              where: {
                solicitudId: In(solicitudes.map(s => s.id)),
                informacionAdicional: Like(`%${key}%`),
              },
            })
          ).map(ce => {
            return +ce.informacionAdicional
              .replace(`${key} (`, '')
              .replace(')', '')
              .replace('AM', '');
          });
          const reasignadosToAMMedical = await this._fetch(
            reasignadosToAMMedicalIds,
            this.centralCompras.ctx,
            this.dynamicConn(this.centralCompras.ctx)
          );
          res.push(...reasignadosToAMMedical);
        } catch (error: any) {}
      }

      const solicitudesRes = await this._fetch(solicitudesIds, ctx, conn);
      res.push(...solicitudesRes);
    }

    return res;
  }

  private async _fetch(ids: number[], ctx: GcmContextType, conn: DataSource) {
    ids.push(0);

    const solicitudRp = conn.getRepository(SolicitudOrm);
    const cambioEstadoRp = conn.getRepository(CambioEstadoOrm);
    const activoFijoRp = conn.getRepository(AfnProductoOrm);
    const productoRp = conn.getRepository(InnProductoOrm);

    const solicitudes = await solicitudRp.find({
      where: { id: In(ids) },
      relations: [
        'usuario',
        'dependencia',
        'dependenciaDestino',
        'detalle',
        'cotizaciones',
        'cotizaciones.detalle',
        'cotizaciones.detalle.item',
        'cotizaciones.cotDocumento.documento',
      ],
      select: {
        id: true,
        centroId: true,
        tipoCode: true,
        estadoCode: true,
        justificacion: true,
        prioridadCode: true,
        usuario: { nombreCompleto: true, cedula: true },
        createdAt: true,
        isCotizacionUnica: true,
        isPagoPorCajaMenor: true,
        dependencia: { nombre: true },
        dependenciaDestino: { nombre: true },
        detalle: { id: true, productoId: true, tipoCode: true, nombre: true, isDeleted: true },
        cotizaciones: {
          id: true,
          isActiva: true,
          detalle: {
            IVA: true,
            descuento: true,
            valorUnitario: true,
            item: { id: true, cantidad: true, isDeleted: true },
          },
          pagada: true,
          recibida: true,
          contabilizada: true,
          cotDocumentoId: true,
          fechaProgramacion: true,
          cotDocumento: { id: true, documento: { consecutivo: true } },
        },
      },
    });

    const solicitudesIds = [0];
    const productosIds = [0];
    const activosFijosIds = [0];

    solicitudes.map(s => {
      solicitudesIds.push(s.id);

      s.detalle = s.detalle.filter(d => !d.isDeleted);

      s.cotizaciones.map(c => {
        const detCotValid: DetalleCotizacionOrm[] = [];
        c.detalle.map(d => {
          if (!d.item.isDeleted) detCotValid.push(d);
        });
        c.detalle = detCotValid;
      });

      s.cotizaciones = s.cotizaciones.filter(c => c.detalle.length && c.isActiva !== false);

      s.detalle.forEach(d => {
        const prodId = d.productoId;
        if (prodId && d.tipoCode === TIPOS.PRODUCTOS.getCode()) productosIds.push(prodId);
        if (prodId && d.tipoCode === TIPOS.ACTIVO_FIJO.getCode()) activosFijosIds.push(prodId);
      });
    });

    const productos = await productoRp.find({
      where: { id: In(productosIds) },
      select: { id: true, descripcion: true },
    });

    const activosFijos = await activoFijoRp.find({
      where: { id: In(activosFijosIds) },
      select: { id: true, descripcion: true },
    });

    solicitudes.map(s => {
      s.detalle.map(d => {
        if (d.productoId) {
          if (d.tipoCode === TIPOS.PRODUCTOS.getCode()) {
            d.producto = productos.filter(p => p.id === d.productoId)[0];
          }
          if (d.tipoCode === TIPOS.ACTIVO_FIJO.getCode()) {
            d.producto = activosFijos.filter(p => p.id === d.productoId)[0] as any;
          }
        } else {
          d.producto = null;
        }
      });
    });

    const ultimosCambiosEstadosBySolicitud: UltimoCambioEstadoBySolicitudI[] = await conn.query(
      ultimosCambiosEstadosBySolicitudQr(solicitudesIds)
    );

    let aprobadosCotiRecomen: CambioEstadoOrm[] = [];

    if (this.canAprobarCotizacionRecomendada) {
      aprobadosCotiRecomen = await cambioEstadoRp.find({
        where: {
          solicitudId: In(ids),
          tipoCode: ESTADOS.COTI_APROBADA.getCode(),
          keyCode: ESTADOS_ESPECIFICOS.COTI_APROBADAS.getCode(),
          usuario: { cedula: this.auth.user.document },
        },
        relations: ['usuario'],
      });
    }

    const solicitudTransformed = solicitudes.map(s => {
      const ultimoCambioEstado = ultimosCambiosEstadosBySolicitud.filter(
        u => u.solicitudId === s.id
      )![0];

      s.authInSameContext = ctx === this.auth.context;

      s.cotizacionRecomendadaAprobadaByMe =
        aprobadosCotiRecomen.filter(a => a.solicitudId === s.id).length > 0;

      return solicitudOrmToBasicInfoSolicitudRes(s, ctx, ultimoCambioEstado);
    });

    return orderBy(solicitudTransformed, 'id', 'desc');
  }
}

import { Injectable } from '@nestjs/common';
import { Between, In, Not } from 'typeorm';
import { GcmContexts } from '@common/application/constants';
import { FILE_LOCATIONS } from '@common/application/file-locations';
import { consecutivosServices } from '@common/application/services';
import { GcmContextType, gcmContextFactory } from '@common/domain/types';
import { uniq } from 'lodash';
import { switchConn } from '@common/infrastructure/services';
import { CentralComprasSource } from '../../base';
import {
  CambioEstadoOrm,
  DetalleCotizacionOrm,
  SolicitudOrm,
} from '../../../@orm/inn/central-compras';
import { UsuarioDependenciaOrm, UsuarioOrm } from '../../../@orm/gen';
import { SOLICITUDES_INVALIDAS_CODES } from '../../../application/constants';
import {
  ESTADOS,
  ESTADOS_ESPECIFICOS,
  TIPOS,
  TIPOS_CODES_VALUES,
} from '../../../@types/inn/central-compras/solicitudes';
import { AfnProductoOrm } from '../../../@orm/inn/activos-fijos';
import { ProductoOrm } from '../../../@orm/inn/productos';
import { claseProductoTypeFactory } from '../../../@types/inn/productos';
import { ROL_DEPENDIENTES } from '../../../@types/gen/dependencias';
import { ENVIRONMENTS } from '../../../../../src/app.environments';

@Injectable()
export class GenerateExcelSolicitudesImpl extends CentralComprasSource {
  public async execute(inicio: Date, fin: Date, onlyMedicamentos: boolean) {
    try {
      const userAuthorities = await this.userCodeAuthorities();
      const validations = this.validationsDeprecated(userAuthorities);

      const usuarioDependenciaRp = this.conn.getRepository(UsuarioDependenciaOrm);
      const dependenciasByUser = await usuarioDependenciaRp
        .createQueryBuilder('usuDep')
        .leftJoinAndSelect('usuDep.usuario', 'usuario')
        .leftJoinAndSelect('usuDep.dependencia', 'dependencia')
        .where('usuDep.usuario.id = :id', { id: this.auth.user.id })
        .getMany();

      const onlyMySolicitudes = !validations.canSeeAllSolicitudes;
      const isCentralCompras = this.auth.context.getCode() === GcmContexts.AMMEDICAL;

      const ctxs = onlyMySolicitudes
        ? [this.auth.context.getCode()]
        : isCentralCompras
          ? [
              GcmContexts.ALTACENTRO,
              GcmContexts.AGUACHICA,
              GcmContexts.VALLEDUPAR,
              GcmContexts.SANJUAN,
              GcmContexts.AMMEDICAL,
            ]
          : [this.auth.context.getCode()];

      const solicitudes: SolicitudOrm[] = [];

      const conditions: any = [
        { createdAt: Between(inicio, fin), isDeleted: false },
        { estadoCode: Not(In(SOLICITUDES_INVALIDAS_CODES)), isFinished: false, isDeleted: false },
      ];

      if (onlyMySolicitudes) {
        conditions.map((c: any) => {
          c.usuarioId = this.auth.user.id;
        });
      }

      if (onlyMedicamentos) {
        conditions.map((c: any) => {
          c.tipoCode = TIPOS.MEDICAMENTOS.getCode();
        });
      } else {
        conditions.map((c: any) => {
          c.tipoCode = In(TIPOS_CODES_VALUES.filter(el => el !== TIPOS.MEDICAMENTOS.getCode()));
        });
      }

      const solicitudesReasignadas: { code: number; usuario: UsuarioOrm }[] = [];

      for (let i = 0; i < ctxs.length; i++) {
        const tempSolicitudes = await this._fetchSolicitudes(
          false,
          ctxs[i],
          conditions,
          dependenciasByUser,
          onlyMedicamentos
        );
        solicitudesReasignadas.push(...tempSolicitudes.reasignadas);
        solicitudes.push(...tempSolicitudes.solicitudes);
      }

      if (solicitudesReasignadas.length && (onlyMySolicitudes || !isCentralCompras)) {
        const tempSolicitudes = await this._fetchSolicitudes(
          false,
          GcmContexts.AMMEDICAL,
          conditions,
          dependenciasByUser,
          onlyMedicamentos,
          solicitudesReasignadas.map(el => el.code)
        );

        tempSolicitudes.solicitudes.map(s => {
          s.usuario = solicitudesReasignadas.filter(sr => sr.code === s.id)[0].usuario;
        });

        solicitudes.push(...tempSolicitudes.solicitudes);
      }

      return {
        ...validations,
        solicitudes: validations.canSeeSolicitudesWithValues
          ? solicitudes
          : solicitudes.map(s => {
              s.cotizaciones.map(c => {
                c.detalle.map(d => {
                  d.IVA = 0;
                  d.descuento = 0;
                  d.valorUnitario = 0;
                  d.item.producto.precioSugerido = 0;
                  return d;
                });
                c.pagos.map(p => {
                  p.valor = 0;
                  return p;
                });
              });

              return s;
            }),
      };
    } catch (error: any) {
      console.log(error);
      throw new Error(error.message);
    }
  }

  private _fetchSolicitudes = async (
    isResumido: boolean,
    ctx: GcmContexts,
    conditions: any,
    dependenciasByUser: UsuarioDependenciaOrm[],
    onlyMedicamentos: boolean,
    ids?: number[]
  ) => {
    const solicitudesReasignadas: { code: number; usuario: UsuarioOrm }[] = [];

    const tempConn = this.dynamicQR(gcmContextFactory(ctx));
    const solicitudRp = tempConn.manager.getRepository(SolicitudOrm);
    const activoFijoRp = tempConn.manager.getRepository(AfnProductoOrm);
    const productoRp = tempConn.manager.getRepository(ProductoOrm);

    const solicitudes = await solicitudRp.find({
      where:
        ctx === GcmContexts.AMMEDICAL && ids
          ? {
              id: In(ids),
              estadoCode: isResumido ? undefined : Not(In(SOLICITUDES_INVALIDAS_CODES)),
            }
          : !ids
            ? conditions
            : { id: In(ids) },
      relations: [
        'usuario',
        'dependencia',
        'dependenciaDestino',
        'centro',
        'detalle',
        'cotizaciones',
        'cotizaciones.proveedor',
        'cotizaciones.pagos',
        'cotizaciones.pagos.estadoAlProgramar',
        'cotizaciones.pagos.estadoAlProgramar.usuario',
        'cotizaciones.pagos.estadoAlPagar',
        'cotizaciones.pagos.estadoAlPagar.usuario',
        'cotizaciones.cotDocumento',
        'cotizaciones.cotDocumento.documento',
        'cotizaciones.cotDocumento.documento.creadoPor',
        'cotizaciones.detalle',
        'cotizaciones.detalle.item',
        'cotizaciones.cuentasxPagar',
        'cambiosEstado',
        'cambiosEstado.usuario',
      ],
    });

    let activosFijosIds: number[] = [];
    let productosIds: number[] = [];

    solicitudes.forEach(el => {
      el.detalle.forEach(dt => {
        if (dt.productoId) {
          if (dt.tipoCode === TIPOS.ACTIVO_FIJO.getCode()) {
            activosFijosIds.push(dt.productoId);
          } else {
            productosIds.push(dt.productoId);
          }
        }
      });
    });

    activosFijosIds = uniq(activosFijosIds);
    productosIds = uniq(productosIds);

    const activosFijosFromBd = await activoFijoRp.find({ where: { id: In(activosFijosIds) } });
    const productosFromBd = await productoRp.find({ where: { id: In(productosIds) } });

    solicitudes.map(st => {
      st.detalle = st.detalle.filter(dt => !dt.isDeleted);

      st.detalle.map(dt => {
        if (dt.productoId) {
          if (dt.tipoCode === TIPOS.ACTIVO_FIJO.getCode()) {
            const af = activosFijosFromBd.filter(
              acf => acf.id === dt.productoId && acf.clase === TIPOS.ACTIVO_FIJO
            )[0];
            dt.producto = new ProductoOrm();
            dt.producto.id = af && af.id ? af.id : null;
            dt.producto.codigo = af && af.codigo ? af.codigo : null;
            dt.producto.descripcion = af && af.descripcion ? af.descripcion : null;
            dt.producto.precioSugerido = af && af.precioSugerido ? af.precioSugerido : null;
            dt.producto.isBloqueado = false;
            dt.producto.marca = dt.marca;
            dt.producto.clase = TIPOS.ACTIVO_FIJO as any;
            dt.producto.claseCode = TIPOS.ACTIVO_FIJO.getCode() as any;
          } else {
            const af = productosFromBd.filter(
              acf => acf.id === dt.productoId && acf.clase !== TIPOS.ACTIVO_FIJO
            )[0];
            af.setTypes();
            dt.producto = af;
          }
        } else {
          if (dt.descripcion && dt.descripcion.includes('DESC.:')) {
            dt.informacionAdicional = dt.descripcion.split(`DESC.:`)[1];
          }
          if (dt.nombre && dt.descripcion) dt.informacionAdicional = dt.descripcion;
        }
        dt.setTypes();
      });
      st.cotizaciones.map(ct => {
        ct.detalle.map(ctdt => {
          if (ctdt.item.productoId) {
            if (ctdt.item.tipoCode === TIPOS.ACTIVO_FIJO.getCode()) {
              const af = activosFijosFromBd.filter(
                acf => acf.id === ctdt.item.productoId && acf.clase === TIPOS.ACTIVO_FIJO
              )[0];
              ctdt.item.producto = new ProductoOrm();
              ctdt.item.producto.id = af && af.id ? af.id : null;
              ctdt.item.producto.codigo = af && af.codigo ? af.codigo : null;
              ctdt.item.producto.descripcion = af && af.descripcion ? af.descripcion : null;
              ctdt.item.producto.precioSugerido =
                af && af.precioSugerido ? af.precioSugerido : null;
              ctdt.item.producto.isBloqueado = false;
              ctdt.item.producto.marca = ctdt.item.marca;
              ctdt.item.producto.clase = TIPOS.ACTIVO_FIJO as any;
              ctdt.item.producto.claseCode = TIPOS.ACTIVO_FIJO.getCode() as any;
            } else {
              const af = productosFromBd.filter(
                acf => acf.id === ctdt.item.productoId && acf.clase !== TIPOS.ACTIVO_FIJO
              )[0];
              af.setTypes();
              if (!af.clase) {
                af.clase = claseProductoTypeFactory(st.tipoCode === 1 ? 0 : 1);
              }
              ctdt.item.producto = af;
            }
          } else {
            if (ctdt.item.descripcion && ctdt.item.descripcion.includes('DESC.:')) {
              ctdt.item.informacionAdicional = ctdt.item.descripcion.split(`DESC.:`)[1];
            }

            if (ctdt.item.descripcion && ctdt.item.nombre) {
              ctdt.item.informacionAdicional = ctdt.item.descripcion;
            }
          }
          ctdt.item.setTypes();
        });
        if (onlyMedicamentos) {
          st.detalle.forEach(std => {
            const exist = ct.detalle.filter(ctd => ctd.itemId === std.id);
            if (!exist.length) {
              const newDetCot = new DetalleCotizacionOrm();
              newDetCot.solicitudId = st.id;
              newDetCot.cotizacionId = ct.id;
              newDetCot.itemId = std.id;
              newDetCot.item = std;
              newDetCot.valorUnitario = 0;
              newDetCot.IVA = 0;
              newDetCot.descuento = 0;
              newDetCot.isAprobado = false;
              ct.detalle.push(newDetCot);
            }
          });
        }
      });
    });

    await tempConn.release();

    const tempSolicitudes: SolicitudOrm[] = [];

    solicitudes.forEach(sol => {
      if (sol.estadoCode === ESTADOS.SOL_CARG_COLABORADOR.getCode()) {
        if (sol.usuarioId !== this.auth.user.id) {
          dependenciasByUser.forEach(dpByUs => {
            if (dpByUs.dependencia.id === sol.dependenciaId) {
              if (
                [
                  ROL_DEPENDIENTES.DIRECTOR.getCode(),
                  ROL_DEPENDIENTES.COORDINADOR.getCode(),
                ].indexOf(dpByUs.rolCode) >= 0
              ) {
                tempSolicitudes.push(sol);
              }
            }
          });
        } else {
          tempSolicitudes.push(sol);
        }
      } else {
        tempSolicitudes.push(sol);
      }
    });

    tempSolicitudes.map(el => {
      el.setTypes();
      el.keyForTables = consecutivosServices.idWithContext(
        el.id,
        gcmContextFactory(ctx),
        el.centro.id
      );

      const createdState = new CambioEstadoOrm();
      createdState.createdAt = el.createdAt;
      createdState.keyCode = ESTADOS_ESPECIFICOS.SOL_REGISTRADA.getCode();
      createdState.tipoCode = ESTADOS.SOL_REGISTRADA.getCode();
      createdState.usuario = el.usuario;
      createdState.informacionAdicional = el.justificacion.trim().toUpperCase();
      createdState.id = 1;
      el.cambiosEstado.unshift(createdState);

      el.cambiosEstado.map(ce => {
        ce.setTypes();
        if (ce.tipo === ESTADOS.COTI_POR_APROBAR) {
          ce.informacionAdicional = `Items aprobados para compra`;
        }
        if (ce.tipo === ESTADOS.SOL_EN_COTI && !ce.informacionAdicional) {
          ce.informacionAdicional = `COT. #${ce.entidadRelacionadaId}${
            el.isCotizacionUnica ? ' (UNICA)' : ''
          } AGREGADA`;
        }
        if (ce.tipo === ESTADOS.COTI_APROBADA) {
          ce.informacionAdicional = `Aprob. #${ce.informacionAdicional}`;
        }
        if (ce.key === ESTADOS_ESPECIFICOS.COTI_LISTA_PARA_ENTREGA) {
          ce.informacionAdicional = `OC DE COT. #${ce.entidadRelacionadaId} LISTA PARA ENTREGA${
            ce.informacionAdicional ? `. ${ce.informacionAdicional}` : ''
          }`;
        }
        if (ce.key === ESTADOS_ESPECIFICOS.SOL_REASIGNADA_OTRO_CENTRO) {
          if (ce.informacionAdicional.includes('REASIGNADA A AMMEDICAL')) {
            solicitudesReasignadas.push({
              code: +ce.informacionAdicional
                .replace('REASIGNADA A AMMEDICAL (', '')
                .replace(')', '')
                .replace('AM', ''),
              usuario: el.usuario,
            });
          }
        }
        if (ce.key === ESTADOS_ESPECIFICOS.SOL_COTI_AGREGADA) {
          ce.archivoRelacionado = `${ENVIRONMENTS.apiUrl}/${FILE_LOCATIONS.inn.ctc.cotizaciones}/${ce.archivoRelacionado}`;
        }
      });

      el.centro.contexto = ctx;
      el.authInSameContext = el.centro.contexto === this.auth.context.getCode();

      el.detalle.map(dt => {
        if (dt.fichaTecnica) {
          dt.fichaTecnica = `${ENVIRONMENTS.apiUrl}/${FILE_LOCATIONS.inn.ctc.itemsSolicitud}/${dt.fichaTecnica}`;
        }
        if (dt.formatoInclusion) {
          dt.formatoInclusion = `${ENVIRONMENTS.apiUrl}/${FILE_LOCATIONS.inn.ctc.itemsSolicitud}/${dt.formatoInclusion}`;
        }

        if (!dt.producto) dt.producto = this.createFakeProducto(dt.nombre);
        else dt.descripcion = dt.producto.descripcion;
      });

      el.cotizaciones.map(ct => {
        ct.detalle.map(dt => {
          if (!dt.item.producto) dt.item.producto = this.createFakeProducto(dt.item.descripcion);
          else dt.item.descripcion = dt.item.producto.descripcion;
        });

        if (ct.cotDocumentoId) {
          ct.documento = ct.cotDocumento.documento;
          ct.documentoId = ct.cotDocumento.documentoId;
          ct.tipoPagoCode = ct.cotDocumento.tipoPagoCode;
        }

        ct.pagos.map(pg => {
          if (pg.estadoAlPagar) {
            pg.estadoAlPagar.archivoRelacionado = `${ENVIRONMENTS.apiUrl}/${FILE_LOCATIONS.inn.ctc.comprobantesPago}/${pg.estadoAlPagar.archivoRelacionado}`;
          }
        });

        if (!ct.proveedor) {
          const estadoCot = el.cambiosEstado.filter(
            ce =>
              ce.entidadRelacionadaId === ct.id &&
              ce.tipo.getCode() == ESTADOS_ESPECIFICOS.SOL_COTI_AGREGADA.getCode()
          );

          ct.proveedor = this.createFakeProveedor(estadoCot[0].informacionAdicional);
        }
      });
    });

    return {
      solicitudes: tempSolicitudes.filter(
        s => s.estado.getCode() !== ESTADOS.SOL_REASIGNADA_OTRO_CENTRO.getCode()
      ),
      reasignadas: solicitudesReasignadas,
    };
  };
}

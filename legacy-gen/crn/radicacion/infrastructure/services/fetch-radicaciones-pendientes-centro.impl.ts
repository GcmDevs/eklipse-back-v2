import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { Between, In, IsNull, Repository } from 'typeorm';
import { GCM_CONTEXTS, GCM_CONTEXTS_VALUES, GcmContextType } from '@common/domain/types';
import { ENVIRONMENTS } from 'src/app.environments';
import { uniq } from 'lodash';
import { FILE_LOCATIONS } from '@common/application/file-locations';
import { FacturaOrm } from '@orm/sln';
import { TIPOS_FACTURA } from '@ctypes/sln';
import { ESTADOS_RADICACION } from '@ctypes/crn/rdc';
import { CentroOrm } from '@orm/adn';
import { UsuarioOrm } from '@orm/gen';

export const VALID_CONTEXTS = [
  GCM_CONTEXTS.AGUACHICA,
  GCM_CONTEXTS.ALTACENTRO,
  GCM_CONTEXTS.SANJUAN,
  GCM_CONTEXTS.VALLEDUPAR,
];

const centrosWithTerceros = [
  { ctx: GCM_CONTEXTS.ALTACENTRO, documento: '824001041' },
  { ctx: GCM_CONTEXTS.ALTACENTRO, documento: '9006124131' },
  { ctx: GCM_CONTEXTS.SANJUAN, documento: '900272582' },
  { ctx: GCM_CONTEXTS.VALLEDUPAR, documento: '892300708' },
  { ctx: GCM_CONTEXTS.AGUACHICA, documento: '900772387' },
];

@Injectable()
export class FetchRadPendByCentroImpl extends BaseSource {
  public async execute(inicio: Date, final: Date, getRadicados: boolean, classQuery: 1 | 2 | 3) {
    // 1 + getRadicados : true => Historial facturas radicadas
    // 1 => Pendientes por radicar
    // 3 => Pendientes x recibir
    const ctxs =
      classQuery === 3
        ? VALID_CONTEXTS.filter(el => el !== this.auth.context)
        : [this.auth.context];

    const facturas: FacturaOrm[] = [];

    const tercerosByCentro = this._tercerosGCMbyCentro(this.auth.context, classQuery);

    for (let index = 0; index < ctxs.length; index++) {
      const el = ctxs[index];
      const conn = this.dynamicConn(el);
      const facturaRp = conn.getRepository(FacturaOrm);

      let tempFacturas2 = await facturaRp.find({
        where: {
          tipoCode: In([
            TIPOS_FACTURA.FACTURA_PACIENTE.getCode(),
            TIPOS_FACTURA.FACTURA_ENTIDAD.getCode(),
            TIPOS_FACTURA.FACTURA_GLOBAL_PFGP.getCode(),
          ]),
          fechaFacturacion: Between(inicio, final),
          isAnulado: false,
          detalleContrato: {
            contrato: {
              tercero: { numeroDocumento: In(tercerosByCentro.map(el => el.documento)) },
            },
          },
          detalleRadicacion: {
            radicacion: [{ estadoCode: In([-1, 0, 1, 2]) }, { estadoCode: IsNull() }],
          },
        },
        relations: [
          'creadoPor',
          'ingreso',
          'ingreso.centro',
          'ingreso.paciente',
          'detalleRadicacion',
          'detalleRadicacion.radicacion',
          'soportesRadicacion',
          'soportesRadicacion.creadoPor',
          'detalleContrato',
          'detalleContrato.contrato',
          'detalleContrato.contrato.tercero',
        ],
      });

      const tempFacturas: FacturaOrm[] = [];

      if (classQuery === 3) {
        tempFacturas2.forEach(t => {
          tempFacturas.push(t);
        });
      } else {
        if (getRadicados) {
          tempFacturas2.forEach(t => {
            if (t.detalleRadicacion && t.detalleRadicacion.radicacion) {
              if (
                t.detalleRadicacion.radicacion.estadoCode ===
                ESTADOS_RADICACION.RADICADO_ENTIDAD.getCode()
              ) {
                tempFacturas.push(t);
              }
            }
          });
        } else {
          tempFacturas2.forEach(t => {
            if (t.detalleRadicacion && t.detalleRadicacion.radicacion) {
              if (
                t.detalleRadicacion.radicacion.estadoCode !==
                ESTADOS_RADICACION.RADICADO_ENTIDAD.getCode()
              ) {
                tempFacturas.push(t);
              }
            } else {
              tempFacturas.push(t);
            }
          });
        }
      }

      const verificadoresIds: number[] = [];
      let ctxKey: number;

      tempFacturas.map(d => {
        d.soportesRadicacion.map(sr => {
          sr.comprobanteDocumento = `${ENVIRONMENTS.apiUrl}/${FILE_LOCATIONS.crn.rdc.comprobantes}/${sr.comprobanteDocumento}`;
          sr.facturaDocumento = `${ENVIRONMENTS.apiUrl}/${FILE_LOCATIONS.crn.rdc.comprobantes}/${sr.facturaDocumento}`;
          delete sr.creadoPor.id;
          delete sr.creadoPorId;
          delete sr.facturaId;
          if (sr.verificadoPorId) {
            ctxKey = sr.contextKey;
            verificadoresIds.push(sr.verificadoPorId);
          }
        });

        delete d.creadoPorId;
        if (d.creadoPor) {
          delete d.creadoPor.id;
        }
        delete d.isAnulado;
        if (d.ingreso && d.ingreso.centro) {
          d.centro = d.ingreso.centro;
        }
        if (d.detalleContrato && d.detalleContrato.contrato && d.detalleContrato.contrato.tercero) {
          d.tercero = d.detalleContrato.contrato.tercero;
          d.tercero.setDocumentoForHumans();
          d.tercero.nombreCompleto = d.tercero.nombreCompleto.trim();
          d.tercero.encryptId();
          delete d.detalleContrato;
          delete d.detalleContratoId;

          if (!d.centro) d.centro = new CentroOrm();
          d.centro.contexto = el;

          if (d.ingreso) {
            delete d.ingreso.id;
            delete d.ingreso.centroId;
            delete d.ingreso.centro;
            delete d.ingreso.pacienteId;
            delete d.ingresoId;
            if (d.ingreso.paciente) {
              delete d.ingreso.paciente.id;
            }
          }
        }
        if (d.detalleRadicacion && d.detalleRadicacion.radicacion) {
          d.radicacion = d.detalleRadicacion.radicacion;
          d.radicacion.setTypes();
          delete d.detalleRadicacion;
          delete d.radicacion.estadoCode;
          delete d.radicacion.terceroId;
          if (d.detalleRadicacion && d.detalleRadicacion.usuario) {
            d.detalleRadicacion.usuario.encryptId();
          }
        } else {
          delete d.detalleRadicacion;
          d.radicacion = null;
        }
        d.setTypes(true);
      });

      let usuarioLocalRp: Repository<UsuarioOrm>;

      if (ctxKey) {
        const tempConn = this.dynamicConn(
          GCM_CONTEXTS_VALUES.filter(c => c.getEkKey() === ctxKey)[0]
        );
        usuarioLocalRp = tempConn.getRepository(UsuarioOrm);
      } else usuarioLocalRp = this.conn.getRepository(UsuarioOrm);

      const verificadores = await usuarioLocalRp.find({
        where: { id: In(uniq(verificadoresIds)) },
      });

      tempFacturas.map(f => {
        f.soportesRadicacion.map(sr => {
          if (sr.verificadoPorId) {
            const verificador = verificadores.filter(u => u.id === sr.verificadoPorId);
            if (verificador.length) sr.verificadoPor = verificador[0];
          }
        });
        f.soportesRadicacion.map(sr => {
          if (sr.verificadoPor) delete sr.verificadoPor.id;
          delete sr.verificadoPorId;
        });
      });

      facturas.push(...tempFacturas);
    }

    return facturas;
  }

  private _tercerosGCMbyCentro(context: GcmContextType, classQuery: 1 | 2 | 3) {
    const dt = centrosWithTerceros;
    if (classQuery === 1) return dt.filter(el => el.ctx.getCode() !== context.getCode());
    else return dt.filter(el => el.ctx.getCode() === context.getCode());
  }
}

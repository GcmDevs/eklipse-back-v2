import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';
import { Between, In, Like } from 'typeorm';
import { orderBy, uniq } from 'lodash';
import { RIESGOS_PRODUCTO, RIESGOS_SANITARIOS_PRODUCTO } from '@inn/lgc/rct/types/inn/productos';
import { TIPOS_DOCUMENTO } from '@inn/lgc/rct/types/inn/documentos';
import {
  RecepcionTecnicaOrm,
  RTCSugerenciaOrm,
} from '@inn/lgc/rct/orm/inn/farmacia/recepcion-tecnica';
import {
  ComprobanteEntradaOrm,
  DetalleComprobanteEntradaOrm,
  DocumentoOrm,
  RemisionEntradaOrm,
} from '@inn/lgc/rct/orm/inn/documentos';

@Injectable()
export class FetchRecepcionTecnicaImpl extends BaseSource {
  timeCanBeUpdatedInSeconds = 86400 * 7;

  public async execute(
    start: Date,
    end: Date,
    onlyWithRecTec: boolean,
    onlyComprobantes: boolean,
    onlyRemisiones: boolean,
    pattern?: string
  ) {
    const comprobantesEntrada = onlyComprobantes
      ? await this._comprobantesEntrada(start, end, onlyWithRecTec, pattern)
      : [];

    const remisionesEntrada = onlyRemisiones
      ? await this._remisionesEntrada(start, end, onlyWithRecTec, pattern)
      : [];

    const result = orderBy(
      [
        ...comprobantesEntrada,
        ...remisionesEntrada.filter(el => !el.comprobanteEntradaConsecutivo),
      ],
      'createdAt',
      'desc'
    );

    const almacenes = this._filterByAlmacen(this.auth.context);

    const resultFiltered = almacenes.length
      ? result.filter(el => this._filterByAlmacen(this.auth.context).indexOf(el.almacenId) >= 0)
      : result;

    resultFiltered.map(data => {
      if (this.auth.context === GCM_CONTEXTS.ALTACENTRO) {
        if (data.almacen.nombre === 'FARMACIA') data.almacen.nombre = 'FARMACIA MEDICO CENTRO';
      }
    });

    return resultFiltered;
  }

  private async _comprobantesEntrada(
    start: Date,
    end: Date,
    onlyWithRecTec: boolean,
    pattern?: string
  ): Promise<ComprobanteEntradaOrm[]> {
    let recTecIds!: number[];
    const tipo = TIPOS_DOCUMENTO.COMPROBANTE_ENTRADA;

    const recTecRp = this.conn.getRepository(RecepcionTecnicaOrm);
    const documentoRp = this.conn.getRepository(DocumentoOrm);

    if (onlyWithRecTec && !pattern) {
      const rectecs = await recTecRp.find({
        where: {
          createdAt: Between(start, end),
          tipoDocumentoCode: tipo.getCode(),
        },
      });
      recTecIds = rectecs.map(el => el.documentoId);
    }

    let conditions: any = {
      fecha: Between(start, end),
      tipoCode: tipo.getCode(),
    };

    if (recTecIds) conditions.id = In(recTecIds);

    if (pattern) {
      conditions = {
        comprobanteEntrada: {
          detalle: {
            lote: {
              codigo: Like(`%${pattern}%`),
            },
          },
        },
      };
    }

    const documentos = await documentoRp.find({
      where: conditions,
      relations: [
        'comprobanteEntrada',
        'comprobanteEntrada.proveedor',
        'comprobanteEntrada.almacen',
        'comprobanteEntrada.detalle',
        'comprobanteEntrada.detalle.lote',
        'comprobanteEntrada.detalle.producto',
        'comprobanteEntrada.detalle.itemRemision',
        'comprobanteEntrada.detalle.itemRemision.lote',
        'comprobanteEntrada.detalle.itemRemision.rctProducto',
        'comprobanteEntrada.detalle.itemRemision.rctProducto.lotes',
        'comprobanteEntrada.recepcionesTecnicas',
        'comprobanteEntrada.recepcionesTecnicas.detalle',
        'comprobanteEntrada.recepcionesTecnicas.detalle.lotes',
        'comprobanteEntrada.recepcionesTecnicas.usuario',
        'comprobanteEntrada.recepcionesTecnicas.centro',
      ],
      take: pattern ? 3 : undefined,
    });

    const comprobantesEntrada = documentos.map(el => {
      el.comprobanteEntrada.consecutivo = el.consecutivo;
      el.comprobanteEntrada.createdAt = el.fecha;
      el.comprobanteEntrada.detalle.map(d => {
        if (d.producto.riesgoCode === null) {
          d.producto.riesgoCode = RIESGOS_PRODUCTO.NO_APLICA.getCode();
        }
        if (d.producto.riesgoSanitarioCode === null) {
          d.producto.riesgoSanitarioCode = RIESGOS_SANITARIOS_PRODUCTO.NINGUNA.getCode();
        }
      });
      return el.comprobanteEntrada;
    });

    const sugerenciasIds: number[] = [];

    comprobantesEntrada.map(el => {
      el.detalle.forEach(dt => {
        if (dt.itemRemision) {
          if (dt.itemRemision.rctProducto) {
            const UMConcentracionId = dt.itemRemision.rctProducto.UMConcentracionId;
            const laboratorioId = dt.itemRemision.rctProducto.laboratorioId;
            const presentacionId = dt.itemRemision.rctProducto.presentacionId;
            const formaFarmaceuticaId = dt.itemRemision.rctProducto.formaFarmaceuticaId;
            const vidaUtilId = dt.itemRemision.rctProducto.vidaUtilId;

            if (UMConcentracionId) sugerenciasIds.push(UMConcentracionId);
            if (laboratorioId) sugerenciasIds.push(laboratorioId);
            if (presentacionId) sugerenciasIds.push(presentacionId);
            if (formaFarmaceuticaId) sugerenciasIds.push(formaFarmaceuticaId);
            if (vidaUtilId) sugerenciasIds.push(vidaUtilId);
          }
        }
      });

      el.recepcionesTecnicas.map(rt => {
        rt.detalle.map(dtp => {
          const prod = el.detalle.filter(el => el.id === dtp.itemDetalleId);
          if (prod.length) dtp.cum = prod[0].producto.CUM;
        });

        const diffInSeconds = (new Date().getTime() - new Date(rt.createdAt).getTime()) / 1000;

        if (diffInSeconds > this.timeCanBeUpdatedInSeconds) {
          rt.canBeUpdated = false;
        }

        sugerenciasIds.push(rt.transportadoraId);
        rt.detalle.map(rtDt => {
          if (rtDt.UMConcentracionId) sugerenciasIds.push(rtDt.UMConcentracionId);
          if (rtDt.laboratorioId) sugerenciasIds.push(rtDt.laboratorioId);
          if (rtDt.presentacionId) sugerenciasIds.push(rtDt.presentacionId);
          if (rtDt.formaFarmaceuticaId) sugerenciasIds.push(rtDt.formaFarmaceuticaId);
          if (rtDt.vidaUtilId) sugerenciasIds.push(rtDt.vidaUtilId);
        });

        rt.centro.context = this.auth.context;
      });
    });

    const sugerencias: RTCSugerenciaOrm[] = [];

    const ekQr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);
    await ekQr.connect();
    try {
      const sugerenciaRp = ekQr.manager.getRepository(RTCSugerenciaOrm);
      const result = await sugerenciaRp.find({ where: { id: In(uniq(sugerenciasIds)) } });
      sugerencias.push(...result);
    } finally {
      await ekQr.release();
    }

    sugerencias.map(sg => {
      delete sg.usuarioId;
      delete sg.centroId;
      sg.setTypes();
    });

    comprobantesEntrada.map(el => {
      el.recepcionesTecnicas.map(rt => {
        rt.transportadora = sugerencias.filter(sg => sg.id === rt.transportadoraId)[0];
        delete rt.transportadoraId;
        rt.detalle.map(rtDt => {
          if (rtDt.UMConcentracionId) {
            rtDt.UMConcentracion = sugerencias.filter(sg => sg.id === rtDt.UMConcentracionId)[0];
          }

          if (rtDt.laboratorioId) {
            rtDt.laboratorio = sugerencias.filter(sg => sg.id === rtDt.laboratorioId)[0];
          }

          if (rtDt.presentacionId) {
            rtDt.presentacion = sugerencias.filter(sg => sg.id === rtDt.presentacionId)[0];
          }

          if (rtDt.formaFarmaceuticaId) {
            rtDt.formaFarmaceutica = sugerencias.filter(
              sg => sg.id === rtDt.formaFarmaceuticaId
            )[0];
          }

          if (rtDt.vidaUtilId) {
            rtDt.vidaUtil = sugerencias.filter(sg => sg.id === rtDt.vidaUtilId)[0];
          }

          delete rtDt.recepcionTecnicaId;
          delete rtDt.productoId;
          delete rtDt.UMConcentracionId;
          delete rtDt.laboratorioId;
          delete rtDt.presentacionId;
          delete rtDt.formaFarmaceuticaId;
          delete rtDt.vidaUtilId;
          rtDt.setTypes();
        });
        delete rt.documentoId;
        delete rt.tipoDocumentoCode;
        delete rt.usuarioId;
        delete rt.centroId;
        rt.usuario.encryptId();
      });

      el.proveedor.encryptId();
      el.detalle.map(dt => {
        if (dt.itemRemision) {
          delete dt.itemRemision.productoId;
          if (dt.itemRemision.lote) delete dt.itemRemision.lote.id;
          delete dt.itemRemision.loteId;
          if (dt.itemRemision.rctProducto) {
            dt.itemRemision.rctProducto.setTypes();
            if (dt.itemRemision.rctProducto.UMConcentracionId) {
              dt.itemRemision.rctProducto.UMConcentracion = sugerencias.filter(
                sg => sg.id === dt.itemRemision.rctProducto.UMConcentracionId
              )[0];
            }
            if (dt.itemRemision.rctProducto.laboratorioId) {
              dt.itemRemision.rctProducto.laboratorio = sugerencias.filter(
                sg => sg.id === dt.itemRemision.rctProducto.laboratorioId
              )[0];
            }
            if (dt.itemRemision.rctProducto.presentacionId) {
              dt.itemRemision.rctProducto.presentacion = sugerencias.filter(
                sg => sg.id === dt.itemRemision.rctProducto.presentacionId
              )[0];
            }
            if (dt.itemRemision.rctProducto.formaFarmaceuticaId) {
              dt.itemRemision.rctProducto.formaFarmaceutica = sugerencias.filter(
                sg => sg.id === dt.itemRemision.rctProducto.formaFarmaceuticaId
              )[0];
            }
            if (dt.itemRemision.rctProducto.vidaUtilId) {
              dt.itemRemision.rctProducto.vidaUtil = sugerencias.filter(
                sg => sg.id === dt.itemRemision.rctProducto.vidaUtilId
              )[0];
            }

            delete dt.itemRemision.rctProducto.recepcionTecnicaId;
            delete dt.itemRemision.rctProducto.itemDetalleId;
            delete dt.itemRemision.rctProducto.productoId;
            delete dt.itemRemision.rctProducto.UMConcentracionId;
            delete dt.itemRemision.rctProducto.laboratorioId;
            delete dt.itemRemision.rctProducto.presentacionId;
            delete dt.itemRemision.rctProducto.formaFarmaceuticaId;
            delete dt.itemRemision.rctProducto.vidaUtilId;
          }
        }
        dt.producto.setTypes();
        delete dt.itemRemisionId;
        delete dt.comprobanteEntradaId;
        delete dt.productoId;
        if (dt.lote) {
          delete dt.loteId;
          delete dt.lote.id;
        }
      });
    });

    return comprobantesEntrada;
  }

  private async _remisionesEntrada(
    start: Date,
    end: Date,
    onlyWithRecTec: boolean,
    pattern?: string
  ): Promise<RemisionEntradaOrm[]> {
    let recTecIds!: number[];
    const tipoCode = [3, TIPOS_DOCUMENTO.REMISION_ENTRADA.getCode()];

    if (onlyWithRecTec && !pattern) {
      const recTecRp = this.conn.getRepository(RecepcionTecnicaOrm);
      const rectecs = await recTecRp.find({
        where: {
          createdAt: Between(start, end),
          tipoDocumentoCode: In(tipoCode),
        },
      });
      recTecIds = rectecs.map(el => el.documentoId);
    }

    const documentoRp = this.conn.getRepository(DocumentoOrm);
    const detComprEntradaRp = this.conn.getRepository(DetalleComprobanteEntradaOrm);

    let conditions: any = {
      fecha: Between(start, end),
      tipoCode: 1,
    };

    if (recTecIds) conditions.id = In(recTecIds);

    if (pattern) {
      conditions = {
        remisionEntrada: {
          detalle: {
            lote: {
              codigo: Like(`%${pattern}%`),
            },
          },
        },
      };
    }

    const documentos = await documentoRp.find({
      where: conditions,
      relations: [
        'remisionEntrada',
        'remisionEntrada.almacen',
        'remisionEntrada.proveedor',
        'remisionEntrada.detalle',
        'remisionEntrada.detalle.lote',
        'remisionEntrada.detalle.producto',
        'remisionEntrada.recepcionesTecnicas',
        'remisionEntrada.recepcionesTecnicas.detalle',
        'remisionEntrada.recepcionesTecnicas.detalle.lotes',
        'remisionEntrada.recepcionesTecnicas.usuario',
        'remisionEntrada.recepcionesTecnicas.centro',
      ],
      take: pattern ? 3 : undefined,
    });

    const remisionesEntrada = documentos.map(el => {
      el.remisionEntrada.consecutivo = el.consecutivo;
      el.remisionEntrada.createdAt = el.fecha;
      el.remisionEntrada.detalle.map(d => {
        if (d.producto.riesgoCode === null) {
          d.producto.riesgoCode = RIESGOS_PRODUCTO.NO_APLICA.getCode();
        }
        if (d.producto.riesgoSanitarioCode === null) {
          d.producto.riesgoSanitarioCode = RIESGOS_SANITARIOS_PRODUCTO.NINGUNA.getCode();
        }
      });
      return el.remisionEntrada;
    });

    const sugerenciasIds: number[] = [];
    const itemsRemisionesIds: number[] = [];

    remisionesEntrada.forEach(re => {
      re.detalle.forEach((dt, i) => {
        if (!i) itemsRemisionesIds.push(dt.id);
      });
    });

    const existenEnComprobante = await detComprEntradaRp.find({
      where: { itemRemisionId: In(itemsRemisionesIds) },
      select: {
        id: true,
        itemRemisionId: true,
        comprobanteEntrada: { id: true, documento: { consecutivo: true } },
      },
      relations: ['comprobanteEntrada', 'comprobanteEntrada.documento'],
    });

    remisionesEntrada.map(el => {
      el.recepcionesTecnicas.map(rt => {
        rt.detalle.map(dtp => {
          const prod = el.detalle.filter(el => el.id === dtp.itemDetalleId);
          if (prod.length) dtp.cum = prod[0].producto.CUM;
        });

        const diffInSeconds = (new Date().getTime() - new Date(rt.createdAt).getTime()) / 1000;

        if (diffInSeconds > this.timeCanBeUpdatedInSeconds) {
          rt.canBeUpdated = false;
        }

        sugerenciasIds.push(rt.transportadoraId);
        rt.detalle.map(rtDt => {
          sugerenciasIds.push(rtDt.UMConcentracionId);
          sugerenciasIds.push(rtDt.laboratorioId);
          sugerenciasIds.push(rtDt.presentacionId);
          sugerenciasIds.push(rtDt.formaFarmaceuticaId);
          sugerenciasIds.push(rtDt.vidaUtilId);
        });
        if (rt.centro) rt.centro.context = this.auth.context;
      });
    });

    const sugerencias: RTCSugerenciaOrm[] = [];

    const ekQr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);
    await ekQr.connect();
    try {
      const sugerenciaRp = ekQr.manager.getRepository(RTCSugerenciaOrm);
      const result = await sugerenciaRp.find({ where: { id: In(uniq(sugerenciasIds)) } });
      sugerencias.push(...result);
    } finally {
      await ekQr.release();
    }

    sugerencias.map(sg => {
      delete sg.usuarioId;
      delete sg.centroId;
      sg.setTypes();
    });

    remisionesEntrada.map(el => {
      el.recepcionesTecnicas.map(rt => {
        rt.transportadora = sugerencias.filter(sg => sg.id === rt.transportadoraId)[0];
        delete rt.transportadoraId;
        rt.detalle.map(rtDt => {
          rtDt.UMConcentracion = sugerencias.filter(sg => sg.id === rtDt.UMConcentracionId)[0];
          rtDt.laboratorio = sugerencias.filter(sg => sg.id === rtDt.laboratorioId)[0];
          rtDt.presentacion = sugerencias.filter(sg => sg.id === rtDt.presentacionId)[0];
          rtDt.formaFarmaceutica = sugerencias.filter(sg => sg.id === rtDt.formaFarmaceuticaId)[0];
          rtDt.vidaUtil = sugerencias.filter(sg => sg.id === rtDt.vidaUtilId)[0];

          delete rtDt.recepcionTecnicaId;
          delete rtDt.productoId;
          delete rtDt.UMConcentracionId;
          delete rtDt.laboratorioId;
          delete rtDt.presentacionId;
          delete rtDt.formaFarmaceuticaId;
          delete rtDt.vidaUtilId;
          rtDt.setTypes();
        });
        delete rt.documentoId;
        delete rt.tipoDocumentoCode;
        delete rt.usuarioId;
        delete rt.centroId;
        rt.usuario.encryptId();
      });

      el.proveedor.encryptId();
      el.detalle.map(dt => {
        const existeEnComprobante = existenEnComprobante.filter(ex => ex.itemRemisionId === dt.id);

        if (existeEnComprobante.length) {
          dt.comprobanteEntradaConsecutivo =
            existeEnComprobante[0].comprobanteEntrada.documento.consecutivo;

          el.comprobanteEntradaConsecutivo =
            existeEnComprobante[0].comprobanteEntrada.documento.consecutivo;
        }

        dt.producto.setTypes();
        delete dt.remisionEntradaId;
        delete dt.productoId;
        if (dt.lote) {
          delete dt.loteId;
          delete dt.lote.id;
        }
      });
    });

    return remisionesEntrada.filter(el => el.detalle.length);
  }

  private _filterByAlmacen(ctx: GcmContextType) {
    switch (ctx) {
      case GCM_CONTEXTS.ALTACENTRO:
        return [2, 101, 109, 144, 153, 155, 214];
      case GCM_CONTEXTS.AGUACHICA:
        return [2, 16];
      case GCM_CONTEXTS.AMMEDICAL:
        return [];
      case GCM_CONTEXTS.SANJUAN:
        return [29];
      case GCM_CONTEXTS.VALLEDUPAR:
        return [1];
      default:
        return [];
    }
  }
}

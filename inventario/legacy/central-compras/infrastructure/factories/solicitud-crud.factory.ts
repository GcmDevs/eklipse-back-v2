import {
  CambioEstadoOrm,
  DetalleSolicitudOrm,
  SolicitudOrm,
} from '@inn/lgc/ctc/orm/inn/central-compras';
import { UltimoCambioEstadoBySolicitudI } from '@inn/lgc/ctc/infrastructure/queries';
import { SOLICITUDES_INVALIDAS_CODES } from '@inn/lgc/ctc/application/constants';
import {
  CambioEstadoSolicitudRes,
  ComplementoSolicitudRes,
  DocumentoCotizacionRes,
  BasicInfoSolicitudRes,
  PagoCotizacionRes,
  ItemCotizacionRes,
  ItemSolicitudRes,
  CuentaXPagarRes,
  CotizacionRes,
  DocumentoRes,
} from '@inn/lgc/ctc/infrastructure/responses';
import { additionalDataByCentro, GcmContextType } from '@common/domain/types';
import { EstGlobSoliEnum } from '@inn/lgc/ctc/application/constants';
import { ESTADOS, TIPOS } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { EntidadBasicaRes } from '@common/infrastructure/responses';

export const generateEstadosActuales = (solicitud: SolicitudOrm) => {
  const registradoCodes = [ESTADOS.SOL_REGISTRADA.getCode(), ESTADOS.REGISTRADA.getCode()];

  const rechazadoCodes = SOLICITUDES_INVALIDAS_CODES;

  const aprobadaParaCotizarCodes = [ESTADOS.SOL_APROBADA.getCode()];
  const conCotizacionesCodes = [ESTADOS.SOL_EN_COTI.getCode()];
  const compraPorAprobarCodes = [ESTADOS.COTI_POR_APROBAR.getCode()];
  const ultimosPasosCodes = [ESTADOS.SOL_ULTIMOS_PASOS.getCode()];

  const estadosActuales: EstGlobSoliEnum[] = [];

  if (registradoCodes.indexOf(solicitud.estadoCode) >= 0) {
    estadosActuales.push(EstGlobSoliEnum.REGISTRAD);
  }

  if (rechazadoCodes.indexOf(solicitud.estadoCode) >= 0) {
    estadosActuales.push(EstGlobSoliEnum.RECHAZADA);
  }

  if (aprobadaParaCotizarCodes.indexOf(solicitud.estadoCode) >= 0) {
    estadosActuales.push(EstGlobSoliEnum.APROB_COTIZAR);
  }

  if (conCotizacionesCodes.indexOf(solicitud.estadoCode) >= 0) {
    estadosActuales.push(EstGlobSoliEnum.CON_COTIZACIO);
  }

  if (compraPorAprobarCodes.indexOf(solicitud.estadoCode) >= 0) {
    if (!solicitud.cotizacionRecomendadaAprobadaByMe) {
      estadosActuales.push(EstGlobSoliEnum.COMPR_APROBAR);
    }
  }

  if (ultimosPasosCodes.indexOf(solicitud.estadoCode) >= 0) {
    solicitud.cotizaciones.forEach(c => {
      if (c.isActiva) {
        const OCNoAgregada = !c.cotDocumentoId && !c.fechaProgramacion;
        if (OCNoAgregada) estadosActuales.push(EstGlobSoliEnum.ORDEN_PEND_AGREG);
        else if (!c.fechaProgramacion) estadosActuales.push(EstGlobSoliEnum.ORDEN_PEND_PROGR);
        else if (!c.contabilizada) estadosActuales.push(EstGlobSoliEnum.ORDEN_PEND_CONTA);
        else if (!c.pagada) estadosActuales.push(EstGlobSoliEnum.ORDEN_PEND_PAGAR);
        else if (!c.recibida) estadosActuales.push(EstGlobSoliEnum.ORDEN_PEND_RECIB);
        if (c.recibida || solicitud.isFinished) estadosActuales.push(EstGlobSoliEnum.ORDEN_FINALI);
      }
    });
  }

  if (!estadosActuales.length) estadosActuales.push(EstGlobSoliEnum.NO_ASIGNA);

  return estadosActuales;
};

export const solicitudOrmToBasicInfoSolicitudRes = (
  e: SolicitudOrm,
  ctx: GcmContextType,
  ultimoCambioEstado: UltimoCambioEstadoBySolicitudI
) => {
  const newE: BasicInfoSolicitudRes = {
    id: e.id,
    codigo: additionalDataByCentro(ctx, e.id, e.centroId).abreviattion,
    tipoCode: e.tipoCode,
    justificacion: e.justificacion,
    prioridadCode: e.prioridadCode,
    dependenciaOrigenNombre: e.dependencia.nombre,
    dependenciaDestinoNombre: e.dependenciaDestino?.nombre,
    estadoCode: e.estadoCode,
    usuarioNombre: e.usuario.nombreCompleto,
    usuarioCedula: e.usuario.cedula,
    fechaCreacion: e.createdAt,
    ultimoCambioEstado: ultimoCambioEstado ? ultimoCambioEstado.fechaCreacion : e.createdAt,
    totalFacturado: 0,
    isPagoPorCajaMenor: e.isPagoPorCajaMenor,
    centroId: e.centroId,
    isCotizacionUnica: e.isCotizacionUnica,
    authInSameContext: e.authInSameContext,
    contextoCode: ctx.getCode(),
    estadosActuales: generateEstadosActuales(e),
    codigosOrdenes: '',
    nombreElementosSolicitados: '',
  };

  e.detalle.forEach(d => {
    if (d.producto) newE.nombreElementosSolicitados += ` ${d.producto.descripcion}`;
    else newE.nombreElementosSolicitados += ` ${d.nombre}`;
  });

  e.cotizaciones.forEach(c => {
    if (c.cotDocumento && c.cotDocumento.documento) {
      const consecutivo = c.cotDocumento.documento.consecutivo;
      const keyForSplit = e.tipoCode === TIPOS.SERVICIOS.getCode() ? 'OS' : 'OC';
      const consecSplitted = consecutivo.split(`${keyForSplit}`);
      newE.codigosOrdenes += consecutivo;
      newE.codigosOrdenes += ` ${consecSplitted[0]}${keyForSplit}${+consecSplitted[1]}`;
    }

    if (c.isActiva) {
      c.detalle.forEach(el => {
        const pu = el.valorUnitario;
        const c = el.item.cantidad;
        const i = el.IVA;
        const d = el.descuento;
        const vt = pu * c;

        newE.totalFacturado += vt + (vt / 100) * i - (vt / 100) * d;
      });
    }
  });

  return newE;
};

const _dataToCambioEstadoRes = (ce: CambioEstadoOrm) => {
  if (!ce) return null;
  const newC: CambioEstadoSolicitudRes = {
    id: ce.id,
    informacionAdicional: ce.informacionAdicional,
    entidadRelacionadaId: ce.entidadRelacionadaId,
    archivoRelacionado: ce.archivoRelacionado,
    createdAt: ce.createdAt,
    estadoCode: ce.tipoCode,
    estadoEspecificoCode: ce.keyCode,
    usuario: {
      cedula: ce.usuario.cedula,
      nombreCompleto: ce.usuario.nombreCompleto,
    },
  };

  return newC;
};

const _dataToItemSolicitudRes = (d: DetalleSolicitudOrm) => {
  const res: ItemSolicitudRes = {
    id: d.id,
    cantidad: d.cantidad,
    nombre: d.nombre,
    fichaTecnica: d.fichaTecnica,
    marca: d.marca,
    formatoInclusion: d.formatoInclusion,
    descripcion: d.descripcion,
    tipoCode: d.tipoCode,
    producto: d.producto
      ? {
          id: d.producto.id,
          codigo: d.producto.codigo,
          descripcion: d.producto.descripcion,
          precioSugerido: d.producto.precioSugerido,
        }
      : null,
  };

  return res;
};

export const solicitudOrmToComplementoSolicitudRes = (solicitud: SolicitudOrm) => {
  const newE: ComplementoSolicitudRes = {
    authInSameContext: solicitud.authInSameContext,
    id: solicitud.id,
    codigo: solicitud.keyForTables,
    justificacion: solicitud.justificacion,
    createdAt: solicitud.createdAt,
    isDeleted: solicitud.isDeleted,
    isFinished: solicitud.isFinished,
    isCotizacionUnica: solicitud.isCotizacionUnica,
    isPagoPorCajaMenor: solicitud.isPagoPorCajaMenor,
    isPagoPorCajaMenorExpress: solicitud.isPagoPorCajaMenorExpress,
    usuario: {
      cedula: solicitud.usuario.cedula,
      nombreCompleto: solicitud.usuario.nombreCompleto,
    },
    dependenciaOrigen: {
      id: solicitud.dependencia.id,
      codigo: solicitud.dependencia.codigo,
      nombre: solicitud.dependencia.nombre,
    },
    dependenciaDestino: {
      id: solicitud.dependenciaDestino.id,
      codigo: solicitud.dependenciaDestino.codigo,
      nombre: solicitud.dependenciaDestino.nombre,
    },
    centro: {
      id: solicitud.centro.id,
      codigo: solicitud.centro.codigo,
      nombre: solicitud.centro.nombre,
      contextoCode: solicitud.centro.contexto,
    },
    detalle: solicitud.detalle.map(d => _dataToItemSolicitudRes(d)),
    cambiosEstado: solicitud.cambiosEstado.map(ce => _dataToCambioEstadoRes(ce)),
    prioridadCode: solicitud.prioridadCode,
    estadoCode: solicitud.estadoCode,
    tipoCode: solicitud.tipoCode,
    cotizaciones: solicitud.cotizaciones.map(c => {
      const newProveedor: EntidadBasicaRes = c.proveedor
        ? {
            id: c.proveedor.id,
            codigo: c.proveedor.codigo,
            nombre: c.proveedor.nombre,
          }
        : null;

      const newDocumento: DocumentoRes =
        c.cotDocumento && c.cotDocumento.documento
          ? {
              id: c.cotDocumento.documento.id,
              estadoCode: c.cotDocumento.documento.estadoCode,
              consecutivo: c.cotDocumento.documento.consecutivo,
              fechaCreacion: c.cotDocumento.documento.fechaCreacion,
              creadoPor: c.cotDocumento.documento.creadoPor,
            }
          : null;

      const newCotDocumento: DocumentoCotizacionRes = c.cotDocumento
        ? {
            id: c.cotDocumento.id,
            tipoPagoCode: c.cotDocumento.tipoPagoCode,
            documento: newDocumento,
          }
        : null;

      const newCuentasXPagar: CuentaXPagarRes[] = c.cuentasxPagar
        ? c.cuentasxPagar.map(cxp => {
            const newCxp: CuentaXPagarRes = {
              id: cxp.id,
              retefuente: cxp.retefuente,
              reteica: cxp.reteica,
              reteIVA: cxp.reteIVA,
              createdAt: cxp.createdAt,
            };
            return newCxp;
          })
        : [];

      const newPagos: PagoCotizacionRes[] = c.pagos
        ? c.pagos.map(p => {
            const newPagos: PagoCotizacionRes = {
              id: p.id,
              porcentaje: p.porcentaje,
              valorAPagar: p.valor,
              valorDescuento: p.valorDescuento,
              isPagoAlFinalizarTrabajo: p.pagarAlFinTrabajo,
              cuentaxPagarId: p.cuentaxPagarId,
              fechaProximoPago: p.fechaOrdenCompra,
              diasPlazo: p.diasPlazo,
              fechaProgramacion: p.fechaProgramacion,
              estadoAlProgramar: _dataToCambioEstadoRes(p.estadoAlProgramar),
              estadoAlPagar: _dataToCambioEstadoRes(p.estadoAlPagar),
            };
            return newPagos;
          })
        : [];

      const newDetCot: ItemCotizacionRes[] = c.detalle.map(cd => {
        const newCd: ItemCotizacionRes = {
          id: cd.id,
          valorUnitario: cd.valorUnitario,
          IVA: cd.IVA,
          descuento: cd.descuento,
          isAprobado: cd.isAprobado,
          item: _dataToItemSolicitudRes(cd.item),
        };
        return newCd;
      });

      const newCot: CotizacionRes = {
        id: c.id,
        fechaProgramacion: c.fechaProgramacion,
        isPagada: c.pagada,
        listaParaEntrega: c.listaParaEntrega,
        isContabilizada: c.contabilizada,
        isActiva: c.isActiva,
        requiereUnicaContabilizacion: c.requiereUnicaContabilizacion,
        isRecibida: c.recibida,
        tipoPagoCode: c.tipoPagoCode,
        proveedor: newProveedor,
        pagos: newPagos,
        cotDocumento: newCotDocumento,
        detalle: newDetCot,
        cuentasxPagar: newCuentasXPagar,
      };
      return newCot;
    }),
  };

  return newE;
};

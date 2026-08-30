import {
  AfnActivoSoliSerTecRes,
  AfnDetalleSoliSerTecRes,
  AfnNotaSoliSerTecRes,
  AfnSoliSerTecRes,
  CreateAfnSoliSerTecItemRes,
  CreateAfnSoliSerTecRes,
} from '@inn/lgc/afn/application/responses';
import {
  afnClaseSerTecTypeFactory,
  afnTipoSerTecTypeFactory,
  afnTipoSolSerTecTypeFactory,
  tipoRequerimientoContratoSolSerTecTypeFactory,
  ESTADO_AFNITEM_SOL_SER_TEC,
  estadoAfnActivoTypeFactory,
  estadoAfnItemSolSerTecTypeFactory,
} from '@inn/lgc/afn/types/inn/activos-fijos';
import {
  SSTItemOrm,
  SSTNotaOrm,
  SolicitudServicioTecnicoOrm,
} from '@inn/lgc/afn/orm/inn/activos-fijos/servicio-tecnico';
import { prioridadTypeFactory } from '@inn/lgc/afn/types/gen';
import { ENVIRONMENTS } from '@inn/app.environments';
import { dataToEntidadBasicaRes, dataToUsuarioBasicoRes } from '@common/infrastructure/responses';
import { AFN_FILE_LOCATIONS } from '../../application/constants';
import { CreateSoliSerTecPayload, ItemSoliSerTecPayload } from '../../application/payloads';

export const sstNotaOrmToAfnNotaSoliSerTecRes = (
  nota: SSTNotaOrm,
  notas: SSTNotaOrm[],
  authId: number
) => {
  const nn = new AfnNotaSoliSerTecRes();
  nn.id = nota.id;
  nn.isNotaAdicionalAllowed = [true, false].indexOf(nota.isAprobado) >= 0 ? false : true;
  nn.creadoPor = dataToUsuarioBasicoRes(nota.creadoPor);
  nn.fechaCreacion = nota.fechaCreacion;
  nn.isNotaPrincipal = nota.isNotaPrincipal;
  if (nota.nota) {
    let index = nota.nota.indexOf('sltec');
    if (index !== -1) {
      nota.nota = nota.nota.slice(index + 5);
      nn.isNotaAdicionalAllowed = false;
      if (nota.solicitud) {
        nn.solicitudCreadoPorId = nota.solicitud.creadoPorId;
      }
    }
  }
  nn.nota = nota.nota;
  nn.isVisto = nota.creadoPorId === authId ? true : nota.isVisto;
  if (nota.notaRelacionadaId) {
    const notaRelacionada = notas.filter(nr => nr.id === nota.notaRelacionadaId)[0];
    nn.notaRelacionada = sstNotaOrmToAfnNotaSoliSerTecRes(notaRelacionada, notas, authId);
  }
  if (nota.img1Link) {
    nn.img1Link = `${ENVIRONMENTS.apiUrl}/${AFN_FILE_LOCATIONS.svt.comprobantesSoluc}/${nota.img1Link}`;
  }
  if (nota.img2Link) {
    nn.img2Link = `${ENVIRONMENTS.apiUrl}/${AFN_FILE_LOCATIONS.svt.comprobantesSoluc}/${nota.img2Link}`;
  }
  return nn;
};

export const afnSoliSerTecOrmToAfnSoliSerTecResFactory = (
  data: SolicitudServicioTecnicoOrm,
  authId: number
) => {
  const e = new AfnSoliSerTecRes();
  e.id = data.id;
  e.prioridad = prioridadTypeFactory(data.prioridadCode);
  e.dependencia = dataToEntidadBasicaRes(data.dependencia);
  e.centro = dataToEntidadBasicaRes(data.centro);
  e.creadoPor = dataToUsuarioBasicoRes(data.creadoPor);
  e.fechaCreacion = data.fechaCreacion;
  e.ubicacion = data.ubicacion;
  e.detalle = [];

  data.detalle.forEach(d => {
    const nd = new AfnDetalleSoliSerTecRes();
    nd.notasPendientesPorLeer = 0;

    d.notas.forEach(n => {
      if (n.creadoPorId !== authId) {
        if (!n.isVisto) nd.notasPendientesPorLeer++;
      }
    });

    nd.id = d.id;
    if (d.img1Link) {
      nd.img1Link = `${ENVIRONMENTS.apiUrl}/${AFN_FILE_LOCATIONS.svt.comprobantesFallo}/${d.img1Link}`;
    }
    if (d.img2Link) {
      nd.img2Link = `${ENVIRONMENTS.apiUrl}/${AFN_FILE_LOCATIONS.svt.comprobantesFallo}/${d.img2Link}`;
    }

    if (d.requerimientoCode) {
      nd.tipoRequerimientoContrato = tipoRequerimientoContratoSolSerTecTypeFactory(
        d.requerimientoCode
      );
    }
    nd.isFallaInUsoClinico = d.isFallaInUsoClinico;
    nd.isPacienteLesionadoByEquipo = d.isPacienteLesionadoByEquipo;
    nd.tipoMantenimiento = afnTipoSolSerTecTypeFactory(d.tipoMantenimientoCode, false);
    nd.tipoServicioTecnico = afnTipoSerTecTypeFactory(d.tipoServicioTecnicoCode, false);
    if (d.claseServicioTecnicoCode) {
      nd.claseServicioTecnico = afnClaseSerTecTypeFactory(d.claseServicioTecnicoCode, false);
    } else {
      nd.claseServicioTecnico = null;
    }
    if (d.activoId) {
      nd.activo = new AfnActivoSoliSerTecRes();
      nd.activo.id = d.activo.id;
      nd.activo.codigo = d.activo.codigo;
      nd.activo.estado = estadoAfnActivoTypeFactory(d.activo.estadoCode);
      nd.activo.placa = d.activo.placa;
    }
    if (d.activo) {
      if (d.activo.informacionAdicional) {
        nd.activo.numeroSerie = d.activo.informacionAdicional.numeroSerie;
      }
      if (d.activo.responsable) {
        nd.activo.responsable = dataToEntidadBasicaRes(d.activo.responsable);
      }
      if (d.activo.producto) {
        d.activo.producto.nombre = d.activo.producto.descripcion;
        nd.activo.producto = dataToEntidadBasicaRes(d.activo.producto);
      }
    }
    nd.atendidoPor = dataToUsuarioBasicoRes(d.atendidoPor);
    nd.fechaInicioAtencion = d.fechaInicioAtencion;
    nd.fechaFinalAtencion = d.fechaFinalAtencion;
    nd.fechaLimReq = d.fechaLimReq;
    nd.estado = estadoAfnItemSolSerTecTypeFactory(d.estadoCode);
    nd.observacion = d.observacion;

    const deleteIsNotaPrincipal = (nt: AfnNotaSoliSerTecRes) => {
      delete nt.isNotaPrincipal;
      if (nt.notaRelacionada) {
        delete nt.notaRelacionada.isNotaPrincipal;
        deleteIsNotaPrincipal(nt.notaRelacionada);
      }
    };

    if (d.notas) {
      nd.notas = d.notas.map(n => sstNotaOrmToAfnNotaSoliSerTecRes(n, d.notas, authId));
      nd.notas = nd.notas.filter(n => n.isNotaPrincipal);
      nd.notas.map(nota => deleteIsNotaPrincipal(nota));
    }
    nd.isAceptadaByAutor = d.isAceptadaByAutor;
    if (d.tiempoHorasOrDias && d.formatoTiempo) {
      const { porcentajeFinal, isFinalizada, fechaLimite } = calcularTiempoProgresoCaso(d);
      nd.oportunidad = {
        tiempoHorasOrDias: d.tiempoHorasOrDias,
        formatoTiempoCode: d.formatoTiempo,
        fechaAtencionProgramada: d.fechaAtencionProgramada,
        isFinalizada: isFinalizada,
        progreso: porcentajeFinal,
        fechaLimite: fechaLimite,
        isTipoTarea: d.isTipoTarea,
      };
    } else {
      nd.oportunidad = {
        tiempoHorasOrDias: 0,
        formatoTiempoCode: 1,
        fechaAtencionProgramada: new Date(),
        isFinalizada: false,
        progreso: 0,
        fechaLimite: new Date().toString(),
        isTipoTarea: null,
      };
    }

    if (d.ingresoId) {
      nd.paciente = {
        id: d.ingreso.paciente.id,
        documento: d.ingreso.paciente.numDoc,
        nombre: d.ingreso.paciente.nombreCompleto,
        ingreso: { id: d.ingresoId, consecutivo: d.ingreso.consecutivo },
        planBeneficio: {
          id: d.ingreso.contratoId,
          codigo: d.ingreso.contrato.codigo,
          nombre: d.ingreso.contrato.nombre,
        },
        tercero: {
          id: null!,
          codigo: d.ingreso.contrato.tercero.numeroDocumento,
          nombre: d.ingreso.contrato.tercero.nombreCompleto,
        },
      };
    }
    e.detalle.push(nd);
  });
  return e;
};

export const createSoliServTecnPayloadToAfnSoliSerTecOrmFactory = (
  data: CreateSoliSerTecPayload,
  authUserId: number
) => {
  const e = new SolicitudServicioTecnicoOrm();
  e.prioridadCode = prioridadTypeFactory(data.prioridadCode).getCode();
  e.centroId = data.centroId;
  e.dependenciaId = data.dependenciaId;
  e.ubicacion = data.ubicacion;
  e.creadoPorId = authUserId;
  e.fechaCreacion = new Date();
  return e;
};

export const itemSoliServTecnPayloadToAfnItemSoliSerTecOrmFactory = (
  data: ItemSoliSerTecPayload,
  solicitud: SolicitudServicioTecnicoOrm
) => {
  const e = new SSTItemOrm();
  if (data.activoId) e.activoId = data.activoId;
  if (data.ingresoId) e.ingresoId = data.ingresoId;
  e.observacion = data.observacion;
  e.solicitudId = solicitud.id;
  e.isFallaInUsoClinico = data.isFallaInUsoClinico;
  e.isPacienteLesionadoByEquipo = data.isPacienteLesionadoByEquipo;
  e.estadoCode = ESTADO_AFNITEM_SOL_SER_TEC.REGISTRADA.getCode();
  e.fechaLimReq = data.fechaLimReq;
  e.tipoServicioTecnicoCode = afnTipoSerTecTypeFactory(data.tipoServicioTecnicoCode).getCode();
  e.tipoMantenimientoCode = afnTipoSolSerTecTypeFactory(data.tipoMantenimientoCode).getCode();
  if (data.tipoRequerimientoContratoCode) {
    e.requerimientoCode = tipoRequerimientoContratoSolSerTecTypeFactory(
      data.tipoRequerimientoContratoCode
    ).getCode();
  } else {
    e.requerimientoCode = null;
  }

  return e;
};

export const afnSoliSerTecOrmToCreateAfnSoliSerTecResFactory = (
  data: SolicitudServicioTecnicoOrm
) => {
  const e = new CreateAfnSoliSerTecRes();
  e.id = data.id;
  e.detalle = [];
  data.detalle.forEach(d => {
    const nd = new CreateAfnSoliSerTecItemRes();
    nd.id = d.id;
    nd.activoId = d.activoId;
    e.detalle.push(nd);
  });
  return e;
};

const calcularTiempoProgresoCaso = (item: SSTItemOrm) => {
  const { tiempoHorasOrDias, formatoTiempo, fechaAtencionProgramada, notas } = item;

  const notaFinalizacionCaso = notas
    .slice()
    .sort((a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime())
    .find(v => v.estadoCode === ESTADO_AFNITEM_SOL_SER_TEC.FINALIZADA.getCode());

  let referenciaFinalMs: number;

  let isFinalizada = false;

  const inicioMs = new Date(fechaAtencionProgramada).getTime();

  if (notaFinalizacionCaso) {
    isFinalizada = true;
    referenciaFinalMs = new Date(notaFinalizacionCaso.fechaCreacion).getTime();
  } else {
    referenciaFinalMs = Date.now();
  }

  const totalHoras = formatoTiempo === 2 ? tiempoHorasOrDias * 24 : tiempoHorasOrDias;

  const totalMs = totalHoras * 60 * 60 * 1000;

  const fechaLimite = new Date(inicioMs + totalMs);

  const transcurridoMs = referenciaFinalMs - inicioMs;

  const porcentajeConsumido = (transcurridoMs / totalMs) * 100;

  const porcentajeFinal = Math.min(Math.max(porcentajeConsumido, 0), 100);

  return {
    porcentajeFinal: porcentajeFinal,
    isFinalizada: isFinalizada,
    fechaLimite: fechaLimite.toString(),
  };
};

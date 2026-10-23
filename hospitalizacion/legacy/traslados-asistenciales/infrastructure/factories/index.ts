import { SIGNO_VITAL_PRIMARIO_VALUES } from '@hpn/lgc/tas/types/gcn/traslados-asistenciales/signo-vital';
import {
  edadDesdeNacimiento,
  fechaNacimientoCalendario,
} from '../../application/helpers/fecha-nacimiento';
import {
  DataRes,
  PacienteDataRes,
  ProcedimientoDataRes,
  SignosVitalesDetalleDataRes,
  TramoDetalleDataRes,
  TrasladoAsistencialDataRes,
  TrasladoAsistencialDetalleDataRes,
  UbicacionDataRes,
} from '@hpn/lgc/tas/application/responses';
import {
  EntidadOrm,
  TrasladoAsignacionOrm,
  PacienteTrasladoOrm,
  TrasladoAsistencialOrm,
  TrasladoTramoOrm,
  TrasladoSignosVitalesOrm,
  TrasladoNotaOrm,
  UbicacionOrm,
  VehiculoOrm,
  ProcedimientoTempOrm,
  ProcedimientoOrm,
} from '@hpn/lgc/tas/orm/gcn';
import {
  DepartamentoOrm,
  DetalleContratoOrm,
  MunicipioOrm,
  PacienteOrm,
  UsuarioOrm,
} from '@hpn/lgc/tas/orm/gen';
import { tipoSoportesVitalesTypeFactory } from '@hpn/lgc/tas/types/gcn/tipo-soperte-vital';
import { GcmContextType } from '@common/domain/types';
import {
  CondicionClinicaCode,
  CONDICIONES_CLINICAS_CODES,
  AREAS_RECOGIDA_VALUES,
  recuperarClimaSegmentado,
  recuperarTipoVehiculoSegmentado,
} from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';

const getAsignacionActual = (asignaciones?: TrasladoAsignacionOrm[]): TrasladoAsignacionOrm => {
  if (!asignaciones?.length) return null;

  const activa = asignaciones.find(item => !!item?.isActiva);
  if (activa) return activa;

  return (
    [...asignaciones].sort((a, b) => {
      const fechaA = a?.fechaAsignacion ? new Date(a.fechaAsignacion).getTime() : 0;
      const fechaB = b?.fechaAsignacion ? new Date(b.fechaAsignacion).getTime() : 0;
      if (fechaA !== fechaB) return fechaB - fechaA;
      return (b?.id ?? 0) - (a?.id ?? 0);
    })[0] ?? null
  );
};

const newDataToUsuario = (data?: UsuarioOrm) => {
  if (!data) return null;

  return {
    id: data.id,
    nombre: data.nombreCompleto,
    documento: data.cedula,
  };
};

const newDataToAmbulanciaAsignada = (
  asignaciones?: TrasladoAsignacionOrm[],
  vehiculoMap?: Map<number, VehiculoOrm>
) => {
  const asignacionActual = getAsignacionActual(asignaciones);
  if (!asignacionActual) return null;

  const vehiculo = vehiculoMap?.get(asignacionActual.vehiculoId);
  if (!vehiculo) return null;

  return {
    id: vehiculo.id,
    placa: vehiculo.placa,
  };
};

const newDataToAsignacionDetalle = (
  asignacion: TrasladoAsignacionOrm,
  vehiculoMap?: Map<number, VehiculoOrm>,
  empleadoMap?: Map<number, any>
) => {
  if (!asignacion) return null;

  const vehiculo = vehiculoMap?.get(asignacion.vehiculoId);
  const conductor = empleadoMap?.get(asignacion.conductorId);
  const auxiliar = empleadoMap?.get(asignacion.auxiliarId);
  const medico = empleadoMap?.get(asignacion.medicoId);

  return {
    ...asignacion,
    vehiculo: vehiculo ? { id: vehiculo.id, placa: vehiculo.placa } : null,
    conductor: conductor
      ? { id: conductor.id, nombre: conductor.nombre, documento: conductor.documento }
      : null,
    auxiliar: auxiliar
      ? { id: auxiliar.id, nombre: auxiliar.nombre, documento: auxiliar.documento }
      : null,
    medico: medico ? { id: medico.id, nombre: medico.nombre, documento: medico.documento } : null,
    asignadoPor: asignacion.asignadoPor
      ? {
          id: asignacion.asignadoPor.id,
          nombre: asignacion.asignadoPor.nombreCompleto,
          documento: asignacion.asignadoPor.cedula,
        }
      : null,
  };
};

const SIGNOS_VITALES_FIELD_ALIASES: Record<string, string> = {
  sato2: 'sat',
};

const SIGNOS_VITALES_RESPONSE_KEYS: Record<string, string> = {
  sat: 'sato2',
};

const newDataToSignosVitalesDetalle = (
  items?: TrasladoSignosVitalesOrm[]
): SignosVitalesDetalleDataRes[] => {
  if (!items?.length) return [];

  const data: SignosVitalesDetalleDataRes[] = [];

  for (const item of items) {
    if (!item) continue;

    const signosVitales: SignosVitalesDetalleDataRes['item'] = {};

    for (const signoType of SIGNO_VITAL_PRIMARIO_VALUES) {
      const sourceFieldName =
        SIGNOS_VITALES_FIELD_ALIASES[signoType.getField()] ?? signoType.getField();
      const responseFieldName =
        SIGNOS_VITALES_RESPONSE_KEYS[sourceFieldName] ?? signoType.getField();
      const cantidad = item[sourceFieldName];

      if ([null, undefined, ''].includes(cantidad)) continue;

      signosVitales[responseFieldName] = {
        signo: {
          code: signoType.getCode(),
          forHumans: signoType.getLabel(),
        },
        cantidad,
      };
    }

    if (!Object.keys(signosVitales).length) continue;

    data.push({
      id: item.id,
      momentoCode: item.momentoCode ?? null,
      tramoId: item.tramoId,
      asignacionId: item.asignacionId,
      fechaRegistro: item.fechaRegistro,
      usuario: item.usuario
        ? {
            nombre: item.usuario.nombreCompleto,
            documento: item.usuario.cedula,
          }
        : null,
      fechaCreacion: item.fecha,
      observacion: item.observacion ?? null,
      item: signosVitales,
    });
  }

  return data;
};

const newDataToNota = (nota: TrasladoNotaOrm, authorMap?: Map<string, any>) => {
  if (!nota) return null;

  const author = authorMap?.get(nota.usuario?.cedula?.trim());

  return {
    id: nota.id,
    tramoId: nota.tramoId,
    asignacionId: nota.asignacionId,
    fecha: nota.fecha,
    fechaRegistro: nota.fechaRegistro,
    nota: nota.nota,
    usuario: {
      id: nota.usuario?.id,
      nombre: nota.usuario?.nombreCompleto,
      documento: nota.usuario?.cedula,
      tipoEmpleadoCode: author?.tipoCode ?? null,
    },
  };
};

const newDataToNotas = (notas?: TrasladoNotaOrm[], authorMap?: Map<string, any>) => {
  if (!notas?.length) return [];
  return notas.map(nota => newDataToNota(nota, authorMap));
};

export const newDataToTraslados = (
  traslados: TrasladoAsistencialOrm[],
  vehiculoMap?: Map<number, VehiculoOrm>,
  contexto?: GcmContextType,
  misTraslados = false
): TrasladoAsistencialDataRes[] => {
  const data: TrasladoAsistencialDataRes[] = [];

  for (const item of traslados) {
    if (!item) continue;

    const traslado = new TrasladoAsistencialDataRes();

    if (item.paciente) {
      traslado.paciente = newDataToPacienteBase(item.paciente);
    } else if (item.ekPaciente) {
      traslado.paciente = newDataToPaciente(item.ekPaciente);
    }

    const tramoActual =
      item.tramos.find(tramo => tramo.isActivo) ?? item.tramos[item.tramos.length > 1 ? 1 : 0];

    if (misTraslados) {
      traslado.tramos = item.tramos.map(tramo => ({
        id: tramo.id,
        tipoTramoCode: tramo.tipoTramoCode,
        isActivo: tramo.isActivo,
        horaInicioRecorrido: tramo.horaInicioRecorrido,
        horaLlegadaEscena: tramo.horaLlegadaEscena,
        horaSalidaEscena: tramo.horaSalidaEscena,
        horaLlegadaInst: tramo.horaLlegadaInst,
        horaRecepcionInst: tramo.horaRecepcionInst,
        estadoCode: tramo.estadoCode,
      }));
    }

    if (tramoActual.origen) {
      traslado.origen = DNnewDataToUbicacion(tramoActual.origen);
    } else if (tramoActual.ekOrigen) {
      traslado.origen = EKnewDataToUbicacion(tramoActual.ekOrigen);
    }

    if (tramoActual.destino) {
      traslado.destino = DNnewDataToUbicacion(tramoActual.destino);
    } else if (tramoActual.ekDestino) {
      traslado.destino = EKnewDataToUbicacion(tramoActual.ekDestino);
    }

    traslado.id = item.id;

    if (item.contexto || contexto) {
      traslado.contexto = item.contexto || contexto;
      traslado.codigo = `${(item.contexto || contexto).getAbbreviation()}-${item.id}`;
    }
    traslado.cupsCode = item.cupsCode;
    traslado.tipoCode = item.tipoCode;
    traslado.estadoCode = item.estadoCode;
    traslado.fechaCreacion = item.fechaCreacion;
    if (item.fechaProgramada) {
      traslado.fechaHoraProgramada = item.fechaProgramada;
    }
    traslado.tipoRemisionCode = item.tipoRemisionCode;

    if (item.otroTipoRemision) {
      traslado.otroTipoRemision = item.otroTipoRemision;
    }

    traslado.tipoRecorridoCode = item.tipoRecorridoCode;
    traslado.tipoTrasladoCode = item.tipoTrasladoCode;
    traslado.estadoPacienteCode = item.estadoPacienteCode;
    traslado.usuario = newDataToUsuario(item.usuario);
    traslado.vehiculo = newDataToAmbulanciaAsignada(item.asignaciones, vehiculoMap);

    if (item.servicioRequeridoId) {
      traslado.servicioRequerido = {
        id: item.servicioRequerido.id,
        nombre: item.servicioRequerido.nombre,
      };
    }

    data.push(traslado);
  }

  return data;
};

export const newDataToTrasladoDetalle = (
  item: TrasladoAsistencialOrm,
  vehiculoMap?: Map<number, VehiculoOrm>,
  empleadoMap?: Map<number, any>,
  authorMap?: Map<string, any>,
  procedimientoTempMap?: Map<number, ProcedimientoTempOrm>
): TrasladoAsistencialDetalleDataRes => {
  if (!item) return null;

  const traslado = new TrasladoAsistencialDetalleDataRes();
  Object.assign(traslado, item);

  if (item.paciente) {
    traslado.paciente = newDataToPacienteBase(item.paciente);
  } else if (item.ekPaciente) {
    traslado.paciente = newDataToPaciente(item.ekPaciente);
  }

  const tramosOrdenados = [...(item.tramos ?? [])].sort((a, b) => a.orden - b.orden || a.id - b.id);
  const tramoActual =
    tramosOrdenados.find(tramo => tramo.isActivo) ?? tramosOrdenados[tramosOrdenados.length - 1];
  traslado.tramoActualId = tramoActual?.id ?? null;
  traslado.diagnosticoSecundario = item.diagSecundario ?? null;
  traslado.tipoTrasladoCode = tramoActual?.tipoTrasladoCode ?? null;

  if (tramoActual?.origen) {
    traslado.origen = DNnewDataToUbicacion(tramoActual.origen);
  } else if (tramoActual?.ekOrigen) {
    traslado.origen = EKnewDataToUbicacion(tramoActual.ekOrigen);
  }

  if (tramoActual?.destino) {
    traslado.destino = DNnewDataToUbicacion(tramoActual.destino);
  } else if (tramoActual?.ekDestino) {
    traslado.destino = EKnewDataToUbicacion(tramoActual.ekDestino);
  }

  if (item.servicioRequerido) {
    traslado.servicioRequerido = {
      id: item.servicioRequerido.id,
      nombre: item.servicioRequerido.nombre,
    };
  }

  traslado.usuario = newDataToUsuario(item.usuario);
  traslado.vehiculo = newDataToAmbulanciaAsignada(item.asignaciones, vehiculoMap);
  traslado.asignaciones =
    item.asignaciones?.map(asignacion =>
      newDataToAsignacionDetalle(asignacion, vehiculoMap, empleadoMap)
    ) ?? [];
  traslado.asignacionActual = newDataToAsignacionDetalle(
    getAsignacionActual(item.asignaciones),
    vehiculoMap,
    empleadoMap
  );
  traslado.tramos =
    tramosOrdenados.map(tramo => newDataToTramo(tramo, authorMap, procedimientoTempMap)) ?? [];

  // Retrocompatibilidad y resumen: popular campos desde el último tramo relevante
  const ultimoTramoConDatos = [...(item.tramos ?? [])]
    .sort((a, b) => b.orden - a.orden)
    .find(t => t.kmFinal != null || t.recibidoPorNombre || t.firmaImg);

  if (ultimoTramoConDatos) {
    traslado.kmFinal = ultimoTramoConDatos.kmFinal;
    traslado.recibidoPorNombre = ultimoTramoConDatos.recibidoPorNombre;
    traslado.recibidoPorDocumento = ultimoTramoConDatos.recibidoPorDocumento;
    traslado.firmaIgm = ultimoTramoConDatos.firmaImg;
  }

  traslado.tipoSoporteVital = item.tipoSoporteVital?.trim()
    ? item.tipoSoporteVital.split(',').map(code => tipoSoportesVitalesTypeFactory(+code as any))
    : [];

  traslado.condicionesClinicas = item.condicionClinica?.trim()
    ? item.condicionClinica
        .split(',')
        .map(code => Number(code.trim()))
        .filter((code): code is CondicionClinicaCode =>
          CONDICIONES_CLINICAS_CODES.includes(code as CondicionClinicaCode)
        )
        .map(code => ({ code }))
    : [];

  traslado.medicamentosPrevios = (item.medicamentosPrevios ?? []).map(medicamentoPrevio => ({
    id: medicamentoPrevio.id,
    medicamentoId: medicamentoPrevio.medicamentoId ?? null,
    medicamento: medicamentoPrevio.medicamento
      ? {
          id: medicamentoPrevio.medicamento.id,
          codigo: medicamentoPrevio.medicamento.codigo,
          nombre: medicamentoPrevio.medicamento.nombre,
        }
      : null,
    descripcion: medicamentoPrevio.descripcion ?? null,
    fechaCreacion: medicamentoPrevio.fechaCreacion,
  }));

  traslado.prenotificaAlSitio = item.prenotificaAlSitio ?? null;
  traslado.fechaHoraVistoBienPaciente = item.fechaHoraVistoBien ?? null;

  traslado.asignacionActiva = newDataToAsignacionDetalle(
    item.asignaciones?.find(asignacion => asignacion.isActiva) ?? null,
    vehiculoMap,
    empleadoMap
  );
  traslado.registrosSinTramo = {
    signosVitales: newDataToSignosVitalesDetalle(item.signosVitales),
    notas: newDataToNotas(item.notas, authorMap),
    procedimientos: (item.procedimientos ?? []).map(proc =>
      mapProcedimientoToDataRes(proc, procedimientoTempMap)
    ),
    medicamentos: (item.medicamentos ?? []).map(med => ({
      ...med,
      usuario: newDataToUsuario(med.usuario),
    })) as any,
  };
  traslado.fechaHoraProgramada = item.fechaProgramada ?? null;
  traslado.revisionesCentral = (item.revisionesCentral ?? []).map(revision => ({
    ...revision,
    usuarioCentral: newDataToUsuario(revision.usuarioCentral),
  })) as any;
  traslado.accidente = null;
  if (item.accidente) {
    const { traslado: _traslado, vehiculos, area, clima, ...accidente } = item.accidente;
    const areaTexto = String(area ?? '').trim();
    traslado.accidente = {
      ...accidente,
      areaCode:
        AREAS_RECOGIDA_VALUES.find(
          opcion =>
            String(opcion.getCode()) === areaTexto ||
            opcion.getForHumans().toUpperCase() === areaTexto.toUpperCase()
        )?.getCode() ?? null,
      climaCode: recuperarClimaSegmentado(clima),
      vehiculos: (vehiculos ?? []).map(
        ({ accidente: _accidente, usuario: _usuario, tipo, ...vehiculo }) => ({
          ...vehiculo,
          tipoCode: recuperarTipoVehiculoSegmentado(tipo, vehiculo.id),
        })
      ),
    };
  }
  return traslado;
};

const mapProcedimientoToDataRes = (
  proc: ProcedimientoOrm,
  procedimientoTempMap?: Map<number, ProcedimientoTempOrm>
): ProcedimientoDataRes => {
  const registro = {
    registroId: proc.id,
    tramoId: proc.tramoId,
    asignacionId: proc.asignacionId,
    fechaCreacion: proc.fechaCreacion,
    fechaRegistro: proc.fechaRegistro,
    usuario: newDataToUsuario(proc['usuario']),
  };
  if (proc.ekprocedimientoId && procedimientoTempMap) {
    const procTemp = procedimientoTempMap.get(proc.ekprocedimientoId);
    if (procTemp) {
      return {
        ...registro,
        id: procTemp.id,
        nombre: procTemp.nombre,
        codigo: procTemp.codigo,
        isTemporal: true,
      };
    }
  }

  return {
    ...registro,
    id: proc.procedimiento?.id ?? 0,
    nombre: proc.procedimiento?.nombre ?? '',
    codigo: proc.procedimiento?.codigoCups ?? '',
    isTemporal: false,
  };
};

const newDataToTramo = (
  tramo: TrasladoTramoOrm,
  authorMap?: Map<string, any>,
  procedimientoTempMap?: Map<number, ProcedimientoTempOrm>
): TramoDetalleDataRes => {
  if (!tramo) return null;

  return {
    id: tramo.id,
    orden: tramo.orden,
    tipoTrasladoCode: tramo.tipoTrasladoCode,
    archivos: tramo.archivos ?? [],
    horasEsperaMinutos: tramo.horasEspera ?? null,
    tiempoUtilizadoMinutos: tramo.tiempoUtilizado ?? null,
    tipoTramoCode: tramo.tipoTramoCode,
    estadoCode: tramo.estadoCode,
    horaSalida: tramo.horaInicioRecorrido,
    horaLlegada: tramo.horaLlegadaInst,
    horaRecepcionInst: tramo.horaRecepcionInst,
    horaInicioRecorrido: tramo.horaInicioRecorrido,
    horaSolicitud: tramo.horaSolicitud,
    horaDespacho: tramo.horaDespacho,
    horaLlegadaEscena: tramo.horaLlegadaEscena,
    horaSalidaEscena: tramo.horaSalidaEscena,
    horaLlegadaInst: tramo.horaLlegadaInst,
    horasEspera: formatearMinutos(tramo.horasEspera),
    descripcionEspera: tramo.descripcionEspera,
    kmDesviacion: tramo.kmDesviacion,
    tiempoUtilizado: formatearMinutos(tramo.tiempoUtilizado),
    causaDesviacion: tramo.causaDesviacion,
    ingresoIps: tramo.ingresoIps,
    nombreIps: tramo.nombreIps,
    kmInicial: tramo.kmInicial,
    kmFinal: tramo.kmFinal,
    recibidoPorNombre: tramo.recibidoPorNombre,
    recibidoPorDocumento: tramo.recibidoPorDocumento,
    firmaImg: tramo.firmaImg,
    isActivo: tramo.isActivo,
    origen: tramo.ekOrigenId
      ? EKnewDataToUbicacion(tramo.ekOrigen)
      : DNnewDataToUbicacion(tramo.origen),
    destino: tramo.ekDestinoId
      ? EKnewDataToUbicacion(tramo.ekDestino)
      : DNnewDataToUbicacion(tramo.destino),
    signosVitales: newDataToSignosVitalesDetalle(tramo.signosVitales),
    notas: newDataToNotas(tramo.notas, authorMap),
    procedimientos: (tramo.procedimientos ?? []).map(proc =>
      mapProcedimientoToDataRes(proc, procedimientoTempMap)
    ),
    medicamentos: (tramo.medicamentos ?? []).map(med => ({
      ...med,
      usuario: newDataToUsuario(med.usuario),
    })) as any,
  };
};

export const newDataToPaciente = (data: PacienteTrasladoOrm): PacienteDataRes => {
  if (!data) return null;

  const paciente = new PacienteDataRes();
  paciente.id = data.pacienteId ?? data.id;
  paciente.nombres = data.nombre;
  paciente.apellidos = data.apellido;
  paciente.documento = {
    numero: data.numeroDocumento,
    tipoCode: data.tipoDocumentoCode,
  };
  paciente.generoCode = data.generoCode;
  const fechaNacimiento = fechaNacimientoCalendario(data.fechaNacimiento);
  paciente.fechaNacimiento = fechaNacimiento ? new Date(`${fechaNacimiento}T00:00:00Z`) : null;
  paciente.edad = edadDesdeNacimiento(data.fechaNacimiento);
  paciente.afiliacionContrato = new DataRes();
  paciente.afiliacionContrato.id = 0;
  paciente.afiliacionContrato.nombre = data.eps;
  paciente.afiliacionContrato.codigo = 'N/A';
  paciente.datosPersonales = {
    estadoCivilCode: data.estadoCivilCode,
    direccion: data.direccion,
    barrio: data.barrio,
    celular: data.celular,
  };
  paciente.soat = data.soat ?? 'N/A';
  paciente.arl = data.arl ? { id: 0, codigo: 'N/A', nombre: data.arl } : null;
  return paciente;
};

/* export const newDataToUbicacion = (data: UbicacionOrm): UbicacionDataRes => {
  if (!data) return null;

  const ubicacion = new UbicacionDataRes();
  ubicacion.id = data.id;
  ubicacion.codigo = data.institucion?.codigo ?? null;
  ubicacion.nombre = data.nombre ?? null;
  ubicacion.direccion = data.direccion ?? null;
  ubicacion.departamento = newDataRes(data.departamento);
  ubicacion.municipio = newDataRes(data.municipio);

  return ubicacion;
}; */

export const newDataToUbicaciones = (data: EntidadOrm[]): UbicacionDataRes[] => {
  const instituciones: UbicacionDataRes[] = [];

  for (const item of data) {
    if (!item) continue;

    const ubicacion = new UbicacionDataRes();
    ubicacion.id = item.id;
    ubicacion.nit = item.tercero.documento;
    ubicacion.codigo = item.codigoIps;
    ubicacion.nombre = item.nombre;
    ubicacion.direccion = item.tercero?.direccion?.direccion ?? null;
    ubicacion.departamento = newDataRes(item.tercero?.municipio?.departamento);
    ubicacion.municipio = newDataRes(item.tercero?.municipio);

    instituciones.push(ubicacion);
  }

  return instituciones;
};

export const newDataRes = (data?: DepartamentoOrm | MunicipioOrm | DetalleContratoOrm): DataRes => {
  if (!data) return null;

  const item = new DataRes();
  item.id = Number(data.id);
  item.codigo = data.codigo ?? null;
  item.nombre = data.nombre ?? null;

  return item;
};

export const newDataToPacienteBase = (data: PacienteOrm): PacienteDataRes => {
  if (!data) return null;
  const paciente = new PacienteDataRes();
  paciente.id = data.id;
  paciente.nombres = (data.primerNombre ?? '') + ' ' + (data.segundoNombre ?? '');
  paciente.apellidos = (data.primerApellido ?? '') + ' ' + (data.segundoApellido ?? '');
  paciente.fechaNacimiento = data.fechaNacimiento;

  let edad: number | null = null;
  if (data.fechaNacimiento) {
    const hoy = new Date();
    const nac = new Date(data.fechaNacimiento);
    if (!isNaN(nac.getTime())) {
      edad = hoy.getFullYear() - nac.getFullYear();
      const m = hoy.getMonth() - nac.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
        edad--;
      }
    }
  }
  paciente.edad = edad;

  paciente.generoCode = data.generoCode;
  paciente.afiliacionContrato = new DataRes();
  paciente.afiliacionContrato.id = data.detalleContrato?.id ?? 0;
  paciente.afiliacionContrato.nombre = data.detalleContrato?.nombre ?? '';
  paciente.afiliacionContrato.codigo = data.detalleContrato?.codigo ?? '';
  const direccion = Array.isArray(data.direccion) ? data.direccion[0] : data.direccion;
  const telefono = Array.isArray(data.telefono) ? data.telefono[0] : data.telefono;
  paciente.datosPersonales = {
    estadoCivilCode: data.estadoCivilCode,
    direccion: direccion?.direccion ?? '',
    celular: telefono?.telefono ?? '',
  };
  paciente.soat = '';
  paciente.arl = null;
  paciente.documento = {
    numero: data.numeroDoc,
    tipoCode: data.tipoDocumentoCode,
  };

  if (data.estancia) {
    paciente.cama = {
      codigo: data.estancia.cama.codigo,
      nombre: data.estancia.cama.nombre,
      subgrupo: {
        codigo: data.estancia.cama.subgrupo.codigo,
        nombre: data.estancia.cama.subgrupo.nombre,
      },
    };

    if (data.diagnosticos?.length) {
      paciente.diagnosticos = data.diagnosticos;
    }
  }
  return paciente;
};

export const DNnewDataToUbicacion = (data: EntidadOrm): UbicacionDataRes => {
  if (!data?.tercero?.municipio?.departamento) return null;
  const ubicacion = new UbicacionDataRes();

  const dpto = data.tercero.municipio.departamento;

  const municipio = data.tercero.municipio;
  ubicacion.nit = data.tercero.documento;
  ubicacion.ekid = data.id;
  ubicacion.id = data.id;
  ubicacion.direccion = data.tercero.direccion.direccion;
  ubicacion.codigo = data?.codigoIps ?? null;
  ubicacion.nombre = data.nombre ?? null;

  ubicacion.departamento = new DataRes();
  ubicacion.departamento.id = dpto.id;
  ubicacion.departamento.codigo = dpto.codigo;
  ubicacion.departamento.nombre = dpto.nombre;

  ubicacion.municipio = new DataRes();
  ubicacion.municipio.id = municipio.id;
  ubicacion.municipio.codigo = municipio.codigo;
  ubicacion.municipio.nombre = municipio.nombre;
  return ubicacion;
};
export const EKnewDataToUbicacion = (data: UbicacionOrm): UbicacionDataRes => {
  if (!data) return null;
  const ubicacion = new UbicacionDataRes();

  ubicacion.ekid = data.id;
  ubicacion.nombre = data.nombre;
  ubicacion.codigo = 'N/A';
  ubicacion.direccion = data.direccion;

  ubicacion.departamento = new DataRes();
  ubicacion.departamento.id = data.departamento.id;
  ubicacion.departamento.codigo = data.departamento.codigo;
  ubicacion.departamento.nombre = data.departamento.nombre;

  ubicacion.municipio = new DataRes();
  ubicacion.municipio.id = data.municipio.id;
  ubicacion.municipio.codigo = data.municipio.codigo;
  ubicacion.municipio.nombre = data.municipio.nombre;

  return ubicacion;
};

function formatearMinutos(minutos: number): string {
  if (minutos == null) return null;
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;

  if (horas === 0) {
    return `${mins} minuto${mins !== 1 ? 's' : ''}`;
  }

  if (mins === 0) {
    return `${horas} hora${horas !== 1 ? 's' : ''}`;
  }

  return `${horas} hora${horas !== 1 ? 's' : ''} y ${mins} minuto${mins !== 1 ? 's' : ''}`;
}

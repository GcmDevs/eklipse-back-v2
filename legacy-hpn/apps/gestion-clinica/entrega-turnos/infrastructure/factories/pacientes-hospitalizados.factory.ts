import {
  ATPacienteHpnRes,
  dataRes,
  EntergaTurnoSubgrupoRes,
  EntidadRes,
} from '@gestion-clinica/entrega-turnos/application/responses';
import { EN_PROCESO, PENDIENTE, RECIBIDO } from '@gestion-clinica/entrega-turnos/application/types';
import { EntregaTurnoOrm, PacienteEvolucionOrm } from '@orm/gcn';
import { EstanciaOrm } from '@orm/temp';

export const newDataToPacientesHopitalizados = (
  estancias: EstanciaOrm[],
  turno: EntregaTurnoOrm,
  evoluciones: PacienteEvolucionOrm[],
  auth: any,
  evolucionesAnteriores: PacienteEvolucionOrm[] = [],
  asignacionesTemporales: Map<number, number> = new Map(),
  especialidadesTratantesPorIngreso: Map<number, string[]> = new Map()
): dataRes => {
  const ATpaciente: ATPacienteHpnRes[] = [];

  const evolucionMap = new Map<number, PacienteEvolucionOrm>();

  for (const ev of evoluciones) {
    if (!evolucionMap.has(ev.ingresoId)) {
      evolucionMap.set(ev.ingresoId, ev);
    }
  }

  const evolucionAnteriorMap = new Map<number, PacienteEvolucionOrm>();

  for (const evAnt of evolucionesAnteriores) {
    if (!evolucionAnteriorMap.has(evAnt.pacienteId)) {
      evolucionAnteriorMap.set(evAnt.pacienteId, evAnt);
    }
  }

  for (const est of estancias) {
    if (!est) continue;
    const paciente = new ATPacienteHpnRes();
    paciente.id = est.ingreso.paciente.id;
    paciente.ingreso = { id: est.ingreso.id, consecutivo: est.ingreso.consecutivo };
    paciente.nombreCompleto = est.ingreso.paciente.nombreCompleto;
    paciente.numeroDocumento = est.ingreso.paciente.numeroDoc;
    paciente.fechaIngreso = est.fechaIngreso;
    paciente.fechaNacimiento = est.ingreso.paciente.fechaNacimiento;
    paciente.especialidadesTratantes = especialidadesTratantesPorIngreso.get(est.ingreso.id) ?? [];

    paciente.cama = new EntidadRes();
    paciente.cama.id = est.cama.id.toString();
    paciente.cama.codigo = est.cama.codigo;
    paciente.cama.nombre = est.cama.nombre;

    paciente.eps = new EntidadRes();
    paciente.eps.id = est.ingreso.detalleContrato.contrato.id.toString();
    paciente.eps.codigo = est.ingreso.detalleContrato.contrato.codigo;
    paciente.eps.nombre = est.ingreso.detalleContrato.contrato.nombre;

    const evolucion = evolucionMap.get(est.ingreso.id);

    if (evolucion) {
      // Evolución ya registrada en el ingreso actual, tiene prioridad
      paciente.evolucion = evolucion.evolucion;
    } else {
      const anterior = evolucionAnteriorMap.get(est.ingreso.paciente.id);
      const codigoContrato = est.ingreso.detalleContrato?.contrato?.codigo ?? '';
      const esContratoPGP = codigoContrato.startsWith('8');
      // Necesitamos evolución anterior con fecha de egreso y contrato PGP
      if (anterior?.ingreso?.fechaEgreso && esContratoPGP) {
        const fechaIngresoActual = new Date(est.ingreso.fechaIngreso);
        const fechaEgresoAnterior = new Date(anterior.ingreso.fechaEgreso);
        const diferenciaHoras =
          (fechaIngresoActual.getTime() - fechaEgresoAnterior.getTime()) / (1000 * 60 * 60);
        const diaEgreso = fechaEgresoAnterior.getDate(); // debe ser 30
        const diaIngreso = fechaIngresoActual.getDate(); // 30 o 1
        // Cuatro condiciones para corte administrativo
        const esCorteAdministrativo =
          esContratoPGP &&
          diaEgreso === 30 &&
          (diaIngreso === 30 || diaIngreso === 1) &&
          diferenciaHoras >= 0 &&
          diferenciaHoras <= 4;

        if (esCorteAdministrativo && anterior.evolucion) {
          // Arrastrar la última evolución clínica del ingreso anterior
          paciente.evolucion = anterior.evolucion;
        }
      }
    }

    paciente.entregaTurno = [];

    const asignacionTemporalId = asignacionesTemporales.get(est.id);
    if (asignacionTemporalId) {
      paciente.esTemporal = true;
      paciente.asignacionTemporalId = asignacionTemporalId;
      paciente.subgrupoTemporal = {
        id: String(est.cama.subgrupo.id),
        codigo: est.cama.subgrupo.codigo,
        nombre: est.cama.subgrupo.nombre,
      };
    }

    ATpaciente.push(paciente);
  }

  const data = new dataRes();

  if (turno) {
    data.entregaTurnoPorSubgrupoActual = new EntergaTurnoSubgrupoRes();

    data.entregaTurnoPorSubgrupoActual.id = turno.id;

    data.entregaTurnoPorSubgrupoActual.fechaEntrega = turno.fechaEntrega;
    data.entregaTurnoPorSubgrupoActual.fechaRecibe = turno.fechaRecibido;

    data.entregaTurnoPorSubgrupoActual.subgrupo = {
      id: String(turno.subgrupo.id),
      codigo: turno.subgrupo.codigo,
      nombre: turno.subgrupo.nombre,
    };

    data.entregaTurnoPorSubgrupoActual.medicoEntrega = turno.medicoEntrega
      ? {
          id: String(turno.medicoEntrega.id),
          codigo: turno.medicoEntrega.cedula,
          nombre: turno.medicoEntrega.nombreCompleto,
        }
      : null;

    data.entregaTurnoPorSubgrupoActual.medicoRecibe = turno.medicoRecibe
      ? {
          id: String(turno.medicoRecibe.id),
          codigo: turno.medicoRecibe.cedula,
          nombre: turno.medicoRecibe.nombreCompleto,
        }
      : null;
    data.entregaTurnoPorSubgrupoActual.estadoCode = turno.estadoCode;

    data.entregaTurnoPorSubgrupoActual.isActivo = turno.isActivo;

    const medicoAyudanteIds = turno.cambiosTurno
      .map(medico => medico.medicoId)
      .filter(id => id != null);

    const medicoAutorizadoIds = [turno.medicoEntregaTurnoId, ...medicoAyudanteIds];

    if (data.entregaTurnoPorSubgrupoActual.estadoCode === PENDIENTE.getCode()) {
      data.entregaTurnoPorSubgrupoActual.isUsuarioAsignado = true;
    } else if (data.entregaTurnoPorSubgrupoActual.estadoCode === EN_PROCESO.getCode()) {
      data.entregaTurnoPorSubgrupoActual.isUsuarioAsignado = medicoAutorizadoIds.includes(auth.id);
      /*  Number(data.entregaTurnoPorSubgrupoActual.medicoEntrega.id) === auth.id; */
    } else if (data.entregaTurnoPorSubgrupoActual.estadoCode === RECIBIDO.getCode()) {
      data.entregaTurnoPorSubgrupoActual.isUsuarioAsignado = medicoAutorizadoIds.includes(auth.id);
      /*  Number(data.entregaTurnoPorSubgrupoActual.medicoRecibe.id) === auth.id; */
    } else {
      data.entregaTurnoPorSubgrupoActual.isUsuarioAsignado = false;
    }
  }

  data.pacientes = ATpaciente;

  return data;
};

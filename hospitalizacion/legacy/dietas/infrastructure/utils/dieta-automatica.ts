import { DietaDto } from '@lgc/die/presentation/dtos';
import { DetalleOfertaI } from '../data-transfers';
import { PacienteAcostadoI } from '../queries';

const NEGACIONES = ['NO APLICA', 'NADA VIA ORAL'];

function configuracionValida(tipos: DetalleOfertaI[], consistencias: DetalleOfertaI[]): boolean {
  if (!tipos.length || !consistencias.length) return false;
  if ([...tipos, ...consistencias].some(oferta => !oferta.code?.trim())) return false;
  const negacionesTipo = tipos.filter(oferta => NEGACIONES.includes(oferta.name));
  const negacionesConsistencia = consistencias.filter(oferta => NEGACIONES.includes(oferta.name));
  if (!negacionesTipo.length && !negacionesConsistencia.length) return true;
  if (
    tipos.length === 1 &&
    consistencias.length === 1 &&
    NEGACIONES.includes(tipos[0].name) &&
    tipos[0].name === consistencias[0].name
  ) {
    return true;
  }
  return false;
}

export function dietasAutomaticas(pacientes: PacienteAcostadoI[]): {
  dietas: DietaDto[];
  omitidas: number;
} {
  const dietas: DietaDto[] = [];
  for (const paciente of pacientes) {
    const { tipos, consistencias } = paciente.dieta;
    if (!configuracionValida(tipos, consistencias)) continue;
    dietas.push({
      pacienteId: paciente.paciente.id,
      camaId: paciente.cama.id,
      dietaConfig: [...tipos, ...consistencias].map(oferta => oferta.code).join('|'),
      observacion: paciente.dieta.observacion,
      enAislamiento: paciente.dieta.enAislamiento || false,
    });
  }
  return { dietas, omitidas: pacientes.length - dietas.length };
}

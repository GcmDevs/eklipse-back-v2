import { Tanqueo } from '../entities';
import { EstadoTanqueo } from '../enums';
import { Kilometraje } from '../value-objects';

export function findTanqueoIndexById(tanqueos: Tanqueo[], tanqueoId: number): number {
  return tanqueos.findIndex(t => t.getId.getValor === tanqueoId);
}

export function findKilometrajeAnteriorConfiable(
  tanqueos: Tanqueo[],
  index: number
): Kilometraje | null {
  for (let i = index - 1; i >= 0; i--) {
    const t = tanqueos[i];
    if (t.getEstado === EstadoTanqueo.ANULADO) continue;
    const km = t.getKilometraje;
    if (km) return km;
  }
  return null;
}

export function recalcularDerivadosDesdeIndice(tanqueos: Tanqueo[], startIndex: number): void {
  if (startIndex < 0) return;
  for (let i = startIndex; i < tanqueos.length; i++) {
    const t = tanqueos[i];
    if (t.getEstado === EstadoTanqueo.ANULADO) {
      continue;
    }
    const anterior = findKilometrajeAnteriorConfiable(tanqueos, i);
    t.calculateDerivados(anterior);
  }
}

import { Tanqueo } from '@inn/operaciones/tanqueos/domain/entities';
import { Kilometraje } from '@inn/operaciones/tanqueos/domain/value-objects';

/**
 * Valida km del ítem contra la referencia confiable anterior a su fecha (no contra otro ítem del lote).
 */
export function aplicarValidacionKmTanqueoItem(
  tanqueo: Tanqueo,
  referenciaKmConfiable: number | null,
  umbralSalto: number,
  validaOdometro: boolean
): void {
  if (!validaOdometro || !tanqueo.getKilometraje || referenciaKmConfiable == null) {
    return;
  }
  const anterior = Kilometraje.create(referenciaKmConfiable);
  tanqueo.registerInconsistenciaKilometraje(anterior, umbralSalto);
  tanqueo.calculateDerivados(anterior);
}

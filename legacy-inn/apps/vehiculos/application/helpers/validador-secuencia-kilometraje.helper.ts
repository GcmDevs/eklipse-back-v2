import { BadInputError } from '@common/domain/errors';
import { Tanqueo } from '@vehiculos/domain/entities';
import { Kilometraje } from '@vehiculos/domain/value-objects';

export function sortAndValidateSecuenciaKilometraje(
  tanqueosDelMismoVehiculo: Tanqueo[],
  kilometrajeInicial: Kilometraje | null,
  online = false,
  validaKilometraje = true
): Tanqueo[] {
  const ordenados = [...tanqueosDelMismoVehiculo].sort(
    (a, b) => a.getFechaTanqueo.getTime() - b.getFechaTanqueo.getTime()
  );

  if (!validaKilometraje) return ordenados;

  let anterior = kilometrajeInicial;
  for (const tanqueo of ordenados) {
    if (!tanqueo.getKilometraje) continue;
    if (online && anterior && tanqueo.getKilometraje.isMenorQue(anterior)) {
      throw new BadInputError(
        `El kilometraje (${tanqueo.getKilometraje.getValorEnKm} km) es menor al ultimo conocido (${anterior.getValorEnKm} km)`
      );
    }
    tanqueo.registerInconsistenciaKilometraje(anterior);
    tanqueo.calculateDerivados(anterior);
    anterior = tanqueo.getKilometraje;
  }

  return ordenados;
}

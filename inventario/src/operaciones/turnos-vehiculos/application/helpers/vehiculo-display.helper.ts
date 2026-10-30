import { VehiculosService } from '@inn/operaciones/tanqueos/application';

export interface VehiculoDisplay {
  placa?: string;
  codigo?: string;
}

export async function resolveVehiculoDisplay(
  vehiculoService: VehiculosService,
  vehiculoId: number,
): Promise<VehiculoDisplay> {
  const v = await vehiculoService.findById(vehiculoId);
  const placa = v?.getPlaca;
  return { placa, codigo: placa };
}

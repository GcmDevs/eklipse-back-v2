import { Injectable } from '@nestjs/common';
import { UsuarioEqpService } from '@inn/core/identity/application/services/usuario-eqp.service';
import { FlotaSearchScope } from '@inn/operaciones/turnos-vehiculos/domain/repositories/flota.repositories';
import { VehiculosService } from '@inn/operaciones/tanqueos/application';

@Injectable()
export class FlotaSearchService {
  constructor(
    private readonly vehiculoService: VehiculosService,
    private readonly usuarioService: UsuarioEqpService,
  ) {}

  async resolveScope(search?: string): Promise<FlotaSearchScope | undefined> {
    const term = search?.trim();
    if (!term) return undefined;

    const [vehiculos] = await this.vehiculoService.getAll(1, 500, term);
    const vehiculoIds = vehiculos.map(v => v.id);

    const [usuarios] = await this.usuarioService.search(1, 500, term);
    const usuarioIds = usuarios.map(u => u.id);

    if (!vehiculoIds.length && !usuarioIds.length) {
      return { sinCoincidencias: true, vehiculoIds: [], usuarioIds: [] };
    }
    return { vehiculoIds, usuarioIds };
  }
}

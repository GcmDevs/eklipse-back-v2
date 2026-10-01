import { Abastecimiento } from '../entities';
import { AbastecimientoRead } from '../reads';

export interface AbastecimientoRepository {
  save(abastecimiento: Abastecimiento): Promise<Abastecimiento>;
  findById(id: number): Promise<Abastecimiento | null>;
  findViewById(id: number): Promise<AbastecimientoRead | null>;
  findByTanqueoId(tanqueoId: number): Promise<Abastecimiento | null>;
}

import { TanqueoCorreccion } from '../entities';

export interface TanqueoCorreccionRepository {
  saveMany(correcciones: TanqueoCorreccion[]): Promise<TanqueoCorreccion[]>;
  findByTanqueoId(tanqueoId: number): Promise<TanqueoCorreccion[]>;
  existsByInconsistenciaId(inconsistenciaId: number): Promise<boolean>;
}

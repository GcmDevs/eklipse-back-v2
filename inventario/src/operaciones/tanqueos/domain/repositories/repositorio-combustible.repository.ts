import { MovimientoCombustible, RepositorioCombustible } from '../entities';
import { MovimientoCombustibleRead, RepositorioCombustibleRead } from '../reads';

export interface RepositorioCombustibleRepository {
  save(repositorio: RepositorioCombustible): Promise<RepositorioCombustible>;
  findById(id: number): Promise<RepositorioCombustible | null>;
  findViewById(id: number): Promise<RepositorioCombustibleRead | null>;
  findAll(): Promise<RepositorioCombustibleRead[]>;
  saveWithMovimientos(repositorio: RepositorioCombustible): Promise<RepositorioCombustible>;
  findMovimientos(repositorioId: number): Promise<MovimientoCombustibleRead[]>;
  findSalidaByTanqueoId(tanqueoId: number): Promise<MovimientoCombustible | null>;
  existsCompensacion(movimientoId: number): Promise<boolean>;
  findEntradaByAbastecimientoId(abastecimientoId: number): Promise<MovimientoCombustible | null>;
}

import { BaseSource } from '@common/infrastructure/services';
import { RepositorioCombustible } from '@vehiculos/domain/entities';
import { MovimientoCombustibleRead, RepositorioCombustibleRead } from '@vehiculos/domain/reads';
import { RepositorioCombustibleRepository } from '@vehiculos/domain/repositories';
import { RepositorioCombustibleMapper } from '@vehiculos/infrastructure/mappers';
import { fetchEstacionesById, fetchVehiculosById } from '../eklipse-refs';
import { runVehiculosPersist } from '../errors/vehiculos-persistence.error';
import { MovimientoCombustibleOrm, RepositorioCombustibleOrm } from '../orm';
import { resolveRepository } from '@common/infrastructure/persistence/transactional';

export class TypeOrmRepositorioCombustibleRepository
  extends BaseSource
  implements RepositorioCombustibleRepository
{
  private get repository() {
    return resolveRepository(this.conn, RepositorioCombustibleOrm);
  }

  private get movimientoRepository() {
    return resolveRepository(this.conn, MovimientoCombustibleOrm);
  }

  async save(repositorio: RepositorioCombustible): Promise<RepositorioCombustible> {
    const saved = await this.repository.save(RepositorioCombustibleMapper.toOrm(repositorio));
    return this.findById(saved.id);
  }

  async findById(id: number): Promise<RepositorioCombustible | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? RepositorioCombustibleMapper.toDomain(orm) : null;
  }

  async findViewById(id: number): Promise<RepositorioCombustibleRead | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? RepositorioCombustibleMapper.toView(orm) : null;
  }

  async findAll(): Promise<RepositorioCombustibleRead[]> {
    const orms = await this.repository.find({ order: { nombre: 'ASC' } });
    return orms.map(RepositorioCombustibleMapper.toView);
  }

  async saveWithMovimientos(repositorio: RepositorioCombustible): Promise<RepositorioCombustible> {
    return runVehiculosPersist('repository_movement', async () => {
      const saved = await this.repository.save(RepositorioCombustibleMapper.toOrm(repositorio));
      const movimientos = repositorio.pullMovimientosPendientes();
      if (movimientos.length > 0) {
        const orms = movimientos.map(mov => {
          const orm = RepositorioCombustibleMapper.toMovimientoOrm(mov);
          orm.repositorio = { id: saved.id } as MovimientoCombustibleOrm['repositorio'];
          return orm;
        });
        await this.movimientoRepository.save(orms);
      }
      return this.findById(saved.id);
    });
  }

  async findMovimientos(repositorioId: number): Promise<MovimientoCombustibleRead[]> {
    const orms = await this.movimientoRepository.find({
      where: { repositorio: { id: repositorioId } },
      relations: ['repositorio', 'usuario', 'tanqueo', 'abastecimiento'],
      order: { createdAt: 'DESC' },
    });

    const [vehiculos, estaciones] = await Promise.all([
      fetchVehiculosById(
        this.ekConn,
        orms.map(orm => orm.tanqueo?.activoId)
      ),
      fetchEstacionesById(
        this.ekConn,
        orms.map(orm => orm.abastecimiento?.estacionServicioId)
      ),
    ]);

    return RepositorioCombustibleMapper.toMovimientoViews(orms, vehiculos, estaciones);
  }
}

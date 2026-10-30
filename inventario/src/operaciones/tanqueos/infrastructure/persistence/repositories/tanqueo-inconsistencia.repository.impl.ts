import { resolveRepository } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { TanqueoInconsistencia } from '@inn/operaciones/tanqueos/domain/entities';
import { SeveridadInconsistencia } from '@inn/operaciones/tanqueos/domain/enums';
import { EstadoInconsistencia } from '@inn/operaciones/tanqueos/domain/enums/estados.enum';
import { cuentaCodigoInconsistenciaParaEstado } from '@inn/operaciones/tanqueos/domain/policies';
import { TanqueoInconsistenciaRead } from '@inn/operaciones/tanqueos/domain/reads';
import { TanqueoInconsistenciaRepository } from '@inn/operaciones/tanqueos/domain/repositories';
import { TanqueoInconsistenciaMapper } from '@inn/operaciones/tanqueos/infrastructure/mappers';
import { TanqueoInconsistenciaOrm } from '../orm';

export class TypeOrmTanqueoInconsistenciaRepository
  extends BaseSource
  implements TanqueoInconsistenciaRepository
{
  private get repository() {
    return resolveRepository(this.conn, TanqueoInconsistenciaOrm);
  }

  async save(inconsistencia: TanqueoInconsistencia): Promise<TanqueoInconsistencia> {
    const orm = TanqueoInconsistenciaMapper.toOrm(inconsistencia);
    const saved = await this.repository.save(orm);
    return TanqueoInconsistenciaMapper.toDomain(saved);
  }

  async findById(id: number): Promise<TanqueoInconsistencia | null> {
    const orm = await this.repository.findOne({
      where: { id },
      relations: ['tanqueo', 'resueltoPorUsuario'],
    });
    return orm ? TanqueoInconsistenciaMapper.toDomain(orm) : null;
  }

  async findViewById(id: number): Promise<TanqueoInconsistenciaRead | null> {
    const orm = await this.repository.findOne({
      where: { id },
      relations: ['tanqueo', 'resueltoPorUsuario'],
    });
    return orm ? TanqueoInconsistenciaMapper.toView(orm) : null;
  }

  async findByTanqueoId(tanqueoId: number): Promise<TanqueoInconsistenciaRead[]> {
    const orms = await this.repository.find({
      where: { tanqueo: { id: tanqueoId } },
      relations: ['tanqueo', 'resueltoPorUsuario'],
    });
    return orms.map(TanqueoInconsistenciaMapper.toView);
  }

  async findAbiertasByTanqueoId(tanqueoId: number): Promise<TanqueoInconsistencia[]> {
    const orms = await this.repository.find({
      where: {
        tanqueo: { id: tanqueoId },
        estado: EstadoInconsistencia.ABIERTA,
      },
      relations: ['tanqueo', 'resueltoPorUsuario'],
    });
    return orms.map(TanqueoInconsistenciaMapper.toDomain);
  }

  async tieneCriticasAbiertas(tanqueoId: number): Promise<boolean> {
    const abiertas = await this.repository.find({
      where: {
        tanqueo: { id: tanqueoId },
        estado: EstadoInconsistencia.ABIERTA,
        severidad: SeveridadInconsistencia.CRITICA,
      },
    });
    return abiertas.some(inc => cuentaCodigoInconsistenciaParaEstado(inc.codigo));
  }

  async saveMany(inconsistencias: TanqueoInconsistencia[]): Promise<void> {
    const orms = inconsistencias.map(TanqueoInconsistenciaMapper.toOrm);
    await this.repository.save(orms);
  }
}

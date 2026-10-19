import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { getUser } from '@common/infrastructure/services';
import { buildUserScope } from '@auth/application/helpers/user-scope.helper';
import { Recurso } from '@equipos/domain/entities';
import { RecursoAsignacionTecnicoRead, RecursoRead } from '@equipos/domain/read';
import { RECURSO_REPOSITORY, RecursoRepository } from '@equipos/domain/repositories';
import {
  AssingUsuarioTecnicoRecursoDto,
  CreateRecursoDto,
  MotivoFinalizacionAsignacionTecnicoRecursoDto,
} from '@equipos/presentation/dto';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class RecursoService {
  constructor(
    @Inject(RECURSO_REPOSITORY)
    private readonly recursoRepository: RecursoRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager
  ) {}

  async create(data: CreateRecursoDto): Promise<RecursoRead> {
    const recurso = Recurso.create(data.nombre);
    return this.recursoRepository.save(recurso);
  }

  async assingTecnico(
    recursoId: number,
    data: AssingUsuarioTecnicoRecursoDto
  ): Promise<RecursoRead> {
    const recurso = await this.findById(recursoId);
    if (!recurso.isActivo)
      throw new BadInputError('No se puede asignar técnico a un recurso inactivo');

    return this.txManager.transactional(async () => {
      const asignacionActiva = recurso.getAsignacionActiva();

      if (asignacionActiva) {
        if (asignacionActiva.getUsuarioId.getValor === data.usuarioId) {
          throw new BadInputError('El técnico indicado ya está asignado');
        }

        if (!data.motivoCambio) {
          throw new BadInputError('Debe indicar el motivo del reemplazo');
        }

        const asignadoPorId = getUser().id;
        asignacionActiva.finalize({
          finalizadoPorId: asignadoPorId,
          motivoFinalizacion: data.motivoCambio.motivo,
          motivoFinalizacionDetalle: data.motivoCambio.detalle,
        });
      }

      const asignacionUsuario = await this.recursoRepository.findAsignacionActivaByUsuarioId(
        data.usuarioId
      );

      if (asignacionUsuario && asignacionUsuario.getRecursoId.getValor !== recursoId) {
        throw new BadInputError('El tecnico ya tiene una asignación activa');
      }

      const asignadoPorId = getUser().id;
      recurso.assingTecnico({
        usuarioId: data.usuarioId,
        asignadoPorId,
        motivoAsignacion: data.motivoAsignacion?.motivo,
        motivoAsignacionDetalle: data.motivoAsignacion?.detalle,
      });

      return this.recursoRepository.update(recurso);
    });
  }

  async removeTecnico(
    recursoId: number,
    data: MotivoFinalizacionAsignacionTecnicoRecursoDto
  ): Promise<RecursoRead> {
    const recurso = await this.findById(recursoId);
    const asignacionActiva = recurso.getAsignacionActiva();

    if (!asignacionActiva) {
      throw new ResourceNotFoundError('El recurso no tiene asignación activa');
    }

    const finalizadoPorId = getUser().id;
    return this.txManager.transactional(async () => {
      asignacionActiva.finalize({
        finalizadoPorId,
        motivoFinalizacion: data.motivo,
        motivoFinalizacionDetalle: data.detalle,
      });
      return this.recursoRepository.update(recurso);
    });
  }

  async deactivate(recursoId: number): Promise<RecursoRead> {
    const recurso = await this.findById(recursoId);
    recurso.deactivate();
    return this.recursoRepository.update(recurso);
  }

  async reactivate(recursoId: number): Promise<RecursoRead> {
    const recurso = await this.findById(recursoId);
    recurso.reactivate();
    return this.recursoRepository.update(recurso);
  }

  async findAll(): Promise<RecursoRead[]> {
    return this.recursoRepository.findAllView(buildUserScope());
  }

  async findById(id: number): Promise<Recurso> {
    const recurso = await this.recursoRepository.findById(id);
    if (!recurso) throw new ResourceNotFoundError(`Recurso con id ${id} no encontrado`);
    return recurso;
  }

  async getHistorialAsignaciones(recursoId: number): Promise<RecursoAsignacionTecnicoRead[]> {
    await this.findById(recursoId);
    return this.recursoRepository.findHistorialAsignaciones(recursoId);
  }
}

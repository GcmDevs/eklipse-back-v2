import { TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { FiltersEquipos, ResultFindEquipoGlobalSystem } from '@equipos/application';
import { Equipo, EquipoBaja } from '@equipos/domain/entities';
import { EstadoBusquedaEquipo, EstadoEquipo, TipoActividad } from '@equipos/domain/enums';
import { EquipoRead, ResumenEquiposRead } from '@equipos/domain/read';
import { EquiposRepository } from '@equipos/domain/repositories';
import {
  EquipoBajaMapper,
  EquipoMapper,
  PlanActividadMapper,
} from '@equipos/infrastructure/mappers';
import { EquipoBajaOrm, EquipoOrm, PlanActividadOrm } from '@orm/inn/equipos';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { GeneralActivoLegacyView } from '../views/external';

export class TypeOrmEquiposRepository extends BaseSource implements EquiposRepository {
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr ? qr.manager.getRepository(EquipoOrm) : this.conn.getRepository(EquipoOrm);
  }

  private get equipoBajaRepository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr ? qr.manager.getRepository(EquipoBajaOrm) : this.conn.getRepository(EquipoBajaOrm);
  }

  private get planActividadRepository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr
      ? qr.manager.getRepository(PlanActividadOrm)
      : this.conn.getRepository(PlanActividadOrm);
  }

  private readonly generalActivoViewrepository: Repository<GeneralActivoLegacyView> =
    this.conn.getRepository(GeneralActivoLegacyView);

  async save(equipo: Equipo): Promise<Equipo> {
    const equipoOrm = EquipoMapper.toOrm(equipo);
    const equipoOrmSaved = await this.repository.save(equipoOrm);
    return EquipoMapper.toDomain(equipoOrmSaved);
  }

  async findById(id: number): Promise<Equipo | null> {
    const orm = await this.repository.findOne({
      where: { id },
      relations: this.getRelations(),
    });
    return orm ? EquipoMapper.toDomain(orm) : null;
  }

  async findAllAndCount(
    page: number,
    limit: number,
    filters?: {
      tipoActivoId?: number;
      estado?: EstadoEquipo;
      areaId?: number;
      responsablesIds?: number[];
    }
  ): Promise<[EquipoRead[], number]> {
    const qb = this.baseQbRelations();

    if (filters?.estado) {
      qb.andWhere('equipo.estado = :estado', {
        estado: filters.estado,
      });
    }

    if (filters?.tipoActivoId) {
      qb.andWhere('tipoActivo.id = :tipoActivoId', {
        tipoActivoId: filters.tipoActivoId,
      });
    }

    if (filters?.areaId) {
      qb.andWhere('responsable.areaId = :areaId', {
        areaId: filters.areaId,
      });
    }

    if (filters?.responsablesIds?.length > 0) {
      qb.andWhere('responsable.responsableId IN (:...responsablesIds)', {
        responsablesIds: filters.responsablesIds,
      });
    }

    qb.orderBy('equipo.createdAt', 'DESC');
    qb.take(limit);
    qb.skip((page - 1) * limit);
    const [equipos, count] = await qb.getManyAndCount();

    return [equipos.map(EquipoMapper.toView), count];
  }

  async alreadyExist(numeroPlaca: string): Promise<boolean> {
    return await this.repository.exists({ where: { numeroPlaca: numeroPlaca } });
  }

  async update(equipo: Equipo): Promise<Equipo> {
    if (!equipo.getId?.getValor) return null;
    const orm = EquipoMapper.toUpdateOrm(equipo);
    await this.repository.save(orm);
    return this.findById(equipo.getId.getValor);
  }

  async updatePlan(equipo: Equipo, tipo: TipoActividad): Promise<Equipo> {
    const plan = equipo.getPlan(tipo);
    if (!plan) return null;
    const planOrm = PlanActividadMapper.toUpdateOrm(plan, equipo.getId.getValor);
    await this.conn.getRepository(PlanActividadOrm).save(planOrm);
    return this.findById(equipo.getId.getValor);
  }

  async changeEstado(equipo: Equipo): Promise<void> {
    await this.repository.save(EquipoMapper.toUpdateEstadoOrm(equipo));
  }

  async findIdsByTipoEquipoId(tipoEquipoId: number): Promise<number[]> {
    const founds = await this.repository
      .createQueryBuilder('equipo')
      .select('equipo.id', 'id')
      .where('equipo.tipoEquipoRel = :tipoEquipoId', { tipoEquipoId })
      .getRawMany<{ id: number }>();
    return founds.map(row => row.id);
  }

  async findIdsByTipoEquipoIdSinActividad(tipoEquipoId: number): Promise<number[]> {
    const founds = await this.repository
      .createQueryBuilder('equipo')
      .leftJoin('equipo.registrosMantenimientos', 'reg')
      .select('equipo.id', 'id')
      .where('equipo.tipoEquipoRel = :tipoEquipoId', { tipoEquipoId })
      .andWhere('reg.id IS NULL')
      .getRawMany<{ id: number }>();
    return founds.map(row => row.id);
  }

  async findGeneralActivoByNumeroPlaca(
    numeroPlaca: string
  ): Promise<GeneralActivoLegacyView | null> {
    const foundGralActivoView: GeneralActivoLegacyView =
      await this.generalActivoViewrepository.findOne({
        where: { numeroPlaca: numeroPlaca },
      });

    if (!foundGralActivoView) return null;
    return foundGralActivoView;
  }

  async findInGlobalSystemByPlaca(numeroPlaca: string): Promise<ResultFindEquipoGlobalSystem> {
    const equipo = await this.repository.exists({ where: { numeroPlaca } });
    if (equipo) {
      return {
        estado: EstadoBusquedaEquipo.EXISTE,
        equipo: null,
      };
    }
    const equipoLegacy = await this.generalActivoViewrepository.findOne({ where: { numeroPlaca } });
    if (equipoLegacy) {
      return {
        estado: EstadoBusquedaEquipo.IMPORTABLE,
        equipo: equipoLegacy,
      };
    }
    return {
      estado: EstadoBusquedaEquipo.NO_EXISTE,
      equipo: null,
    };
  }

  async alreadyExistActivoLegacy(numeroPlaca: string): Promise<boolean> {
    return await this.generalActivoViewrepository.exists({ where: { numeroPlaca: numeroPlaca } });
  }

  async findViewById(id: number): Promise<EquipoRead | null> {
    const equipoFound = await this.baseQbRelations().where('equipo.id = :id', { id }).getOne();

    return equipoFound ? EquipoMapper.toView(equipoFound) : null;
  }

  async findViewByPlaca(numeroPlaca: string): Promise<EquipoRead | null> {
    const equipoFound = await this.baseQbRelations()
      .where('equipo.numeroPlaca = :numeroPlaca', { numeroPlaca })
      .getOne();

    return equipoFound ? EquipoMapper.toView(equipoFound) : null;
  }

  async saveBaja(equipo: Equipo, baja: EquipoBaja): Promise<void> {
    await this.repository.save(EquipoMapper.toUpdateEstadoOrm(equipo));
    const planesOrm = equipo.getPlanesActividad.map(plan =>
      PlanActividadMapper.toUpdateOrm(plan, equipo.getId.getValor)
    );

    await this.planActividadRepository.save(planesOrm);
    await this.equipoBajaRepository.save(EquipoBajaMapper.toOrm(baja));
  }

  async updateRegistroFotografico(equipo: Equipo): Promise<Equipo | null> {
    const primitives = equipo.getRegistroFotografico;

    const result = await this.repository.update(
      { id: equipo.getId.getValor },
      { registroFotografico: primitives }
    );

    return result.affected ? equipo : null;
  }

  private baseQbRelations(): SelectQueryBuilder<EquipoOrm> {
    return this.repository
      .createQueryBuilder('equipo')
      .leftJoinAndSelect(
        'equipo.accesoriosUnidad',
        'accesoriosUnidad',
        'accesoriosUnidad.descontinuado = :accDescontinuado',
        {
          accDescontinuado: false,
        }
      )
      .leftJoinAndSelect('accesoriosUnidad.accesorioEstandar', 'accesorioEstandar')
      .leftJoinAndSelect('accesorioEstandar.marca', 'accesorioMarca')
      .leftJoinAndSelect('equipo.planesActividad', 'planes')
      .leftJoinAndSelect('planes.formato', 'planFormato')
      .leftJoinAndSelect('equipo.tipoEquipoRel', 'tipoEquipoRel')
      .leftJoinAndSelect('tipoEquipoRel.tipoActivo', 'tipoActivo')
      .leftJoinAndSelect('tipoEquipoRel.subclase', 'tipoEquipoSubclase')
      .leftJoinAndSelect('tipoEquipoRel.documentos', 'documentos')
      .leftJoinAndSelect('documentos.tipoDocumento', 'docTipoDocumento')
      .leftJoinAndSelect('documentos.archivo', 'docArchivo')
      .leftJoinAndSelect('tipoEquipoRel.modelo', 'tipoEquipoModelo')
      .leftJoinAndSelect('tipoEquipoModelo.marca', 'tipoEquipoMarca')
      .leftJoinAndSelect('equipo.responsable', 'responsable')
      .leftJoinAndSelect('equipo.compra', 'compra')
      .leftJoinAndSelect('compra.documentos', 'CompDocumentos')
      .leftJoinAndSelect('CompDocumentos.tipoDocumento', 'CompdocTipoDocumento')
      .leftJoinAndSelect('CompDocumentos.archivo', 'Compdocarchivo')
      .leftJoinAndSelect('compra.proveedor', 'proveedor')
      .leftJoinAndSelect('compra.fabricante', 'fabricante')
      .leftJoinAndSelect('compra.distribuidor', 'distribuidor')
      .leftJoinAndSelect('equipo.planDefaultMantenimiento', 'planDefaultMant')
      .leftJoinAndSelect('planDefaultMant.formato', 'planDefaultMantFormato')
      .leftJoinAndSelect('equipo.planDefaultCalibracion', 'planDefaultCalib')
      .leftJoinAndSelect('planDefaultCalib.formato', 'planDefaultCalibFormato')
      .leftJoinAndSelect('equipo.baja', 'baja')
      .leftJoinAndSelect('baja.archivoActa', 'archivoActa');
  }

  private getRelations(): string[] {
    return [
      'baja',
      'baja.archivoActa',
      'accesoriosUnidad',
      'accesoriosUnidad.accesorioEstandar',
      'accesoriosUnidad.accesorioEstandar.marca',
      'planesActividad',
      'planesActividad.formato',
      'tipoEquipoRel',
      'tipoEquipoRel.tipoActivo',
      'tipoEquipoRel.subclase',
      'tipoEquipoRel.documentos',
      'tipoEquipoRel.documentos.tipoDocumento',
      'tipoEquipoRel.documentos.archivo',
      'tipoEquipoRel.modelo',
      'tipoEquipoRel.modelo.marca',
      'responsable',
      'compra',
      'compra.proveedor',
      'compra.fabricante',
      'compra.distribuidor',
      'planDefaultMantenimiento',
      'planDefaultMantenimiento.formato',
      'planDefaultCalibracion',
      'planDefaultCalibracion.formato',
    ];
  }

  async exists(id: number): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  delete(id: number): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async findAllView(page: number, limit: number): Promise<[EquipoRead[], number]> {
    throw new Error('Method not implemented.');
  }

  async getResumen(filters?: FiltersEquipos): Promise<ResumenEquiposRead> {
    const qb = this.repository
      .createQueryBuilder('equipo')
      .leftJoin('equipo.tipoEquipoRel', 'tipoEquipoRel')
      .leftJoin('tipoEquipoRel.tipoActivo', 'tipoActivo')
      .leftJoin('equipo.responsable', 'responsable');

    this.applyFilters(qb, filters);
    const rows = await qb
      .select('equipo.estado', 'estado')
      .addSelect('tipoActivo.nombre', 'tipoActivoNombre')
      .addSelect('COUNT(equipo.id)', 'total')
      .groupBy('equipo.estado')
      .addGroupBy('tipoActivo.nombre')
      .getRawMany();
    return EquipoMapper.toResumenView(rows);
  }

  private applyFilters(
    qb: SelectQueryBuilder<EquipoOrm>,
    filters?: FiltersEquipos
  ): SelectQueryBuilder<EquipoOrm> {
    if (filters?.estado) {
      qb.andWhere('equipo.estado = :estado', { estado: filters.estado });
    }
    if (filters?.tipoActivoId) {
      qb.andWhere('tipoActivo.id = :tipoActivoId', { tipoActivoId: filters.tipoActivoId });
    }
    if (filters?.areaId) {
      qb.andWhere('responsable.areaId = :areaId', { areaId: filters.areaId });
    }
    if (filters?.responsablesIds?.length > 0) {
      qb.andWhere('responsable.responsableId IN (:...responsablesIds)', {
        responsablesIds: filters.responsablesIds,
      });
    }
    return qb;
  }
}

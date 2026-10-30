import { TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { AmbulanciaFlota, DotacionFlota, DotacionNovedad, ElementoVencFlota, EntregaDeclaracion, EntregaFlota, EventoFlota, LimpiezaFlota, PlantillaFlota, TurnoFlota } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import {
  EntidadEventoFlota,
  EstadoDotacion,
  EstadoEntrega,
  EstadoLimpieza,
  EstadoNovedadDotacion,
  EstadoServicioAmbulancia,
  EstadoTurno,
  FormatoPlantilla,
} from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { FlotaSearchScope } from '@inn/operaciones/turnos-vehiculos/domain/repositories/flota.repositories';
import {
  AmbulanciaFlotaRepository,
  DotacionFlotaRepository,
  DotacionNovedadRepository,
  ElementoVencFlotaRepository,
  EntregaDeclFlotaRepository,
  EntregaFlotaRepository,
  EventoFlotaRepository,
  LimpiezaFlotaRepository,
  PlantillaFlotaRepository,
  TurnoFlotaRepository,
} from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import { PlantillaView } from '@inn/operaciones/turnos-vehiculos/domain/read';
import {
  AmbulanciaFlotaMapper,
  DotacionFlotaMapper,
  DotacionNovedadMapper,
  ElementoVencMapper,
  EntregaDeclMapper,
  EntregaFlotaMapper,
  EventoFlotaMapper,
  LimpiezaFlotaMapper,
  PlantillaFlotaMapper,
  TurnoFlotaMapper,
} from '@inn/operaciones/turnos-vehiculos/infrastructure/mappers';
import { Injectable } from '@nestjs/common';
import { AmbAmbulanciaOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-ambulancia.orm';
import { AmbDotacionNovedadOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-dotacion-novedad.orm';
import { AmbDotacionOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-dotacion.orm';
import { AmbElementoVencOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-elemento-venc.orm';
import { AmbEntregaDeclOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-entrega-decl.orm';
import { AmbEntregaOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-entrega.orm';
import { AmbEventoOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-evento.orm';
import { AmbLimpiezaOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-limpieza.orm';
import { AmbPlantillaOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-plantilla.orm';
import { AmbTurnoOrm } from '@inn/orm/inn/operaciones/turnos-vehiculos/amb-turno.orm';
import { Brackets, In, LessThan, LessThanOrEqual, Not } from 'typeorm';

function applySearchScope(
  qb: ReturnType<ReturnType<BaseSource['conn']['createQueryBuilder']>['andWhere']> extends never
    ? any
    : any,
  alias: string,
  scope?: FlotaSearchScope,
  vehiculoField = 'vehiculoId',
  usuarioField = 'responsableId',
) {
  if (!scope) return;
  if (scope.sinCoincidencias) {
    qb.andWhere('1 = 0');
    return;
  }
  if (!scope.vehiculoIds?.length && !scope.usuarioIds?.length) return;
  qb.andWhere(
    new Brackets(sqb => {
      if (scope.vehiculoIds?.length) {
        sqb.orWhere(`${alias}.${vehiculoField} IN (:...searchVids)`, { searchVids: scope.vehiculoIds });
      }
      if (scope.usuarioIds?.length) {
        sqb.orWhere(`${alias}.${usuarioField} IN (:...searchUids)`, { searchUids: scope.usuarioIds });
      }
    }),
  );
}

function repo<T>(source: BaseSource, entity: { new (): T }) {
  const qr = TypeOrmTransactionContext.getQueryRunner();
  const ds = (source as any).conn;
  return qr ? qr.manager.getRepository(entity) : ds.getRepository(entity);
}

@Injectable()
export class TypeOrmAmbulanciaFlotaRepository extends BaseSource implements AmbulanciaFlotaRepository {
  private get repository() {
    return repo(this, AmbAmbulanciaOrm);
  }

  async save(entity: AmbulanciaFlota): Promise<AmbulanciaFlota> {
    const saved = await this.repository.save(AmbulanciaFlotaMapper.toOrm(entity));
    return AmbulanciaFlotaMapper.toDomain(saved);
  }

  async update(entity: AmbulanciaFlota): Promise<AmbulanciaFlota> {
    return this.save(entity);
  }

  async findByVehiculoId(vehiculoId: number): Promise<AmbulanciaFlota | null> {
    const orm = await this.repository.findOne({ where: { vehiculoId } });
    return orm ? AmbulanciaFlotaMapper.toDomain(orm) : null;
  }

  async findById(id: number): Promise<AmbulanciaFlota | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? AmbulanciaFlotaMapper.toDomain(orm) : null;
  }

  async findEnServicioSinTurnoActivo(): Promise<AmbulanciaFlota[]> {
    const sub = repo(this, AmbTurnoOrm)
      .createQueryBuilder('t')
      .select('1')
      .where('t.vehiculoId = a.vehiculoId')
      .andWhere('t.estado IN (:...st)');
    const orms = await this.repository
      .createQueryBuilder('a')
      .where('a.estadoServicio = :es', { es: EstadoServicioAmbulancia.EN_SERVICIO })
      .andWhere(`NOT EXISTS (${sub.getQuery()})`)
      .setParameters({ es: EstadoServicioAmbulancia.EN_SERVICIO, st: [EstadoTurno.ACTIVO, EstadoTurno.ENTREGADO] })
      .orderBy('a.vehiculoId', 'ASC')
      .getMany();
    return orms.map(AmbulanciaFlotaMapper.toDomain);
  }

  async findFueraServicio(): Promise<AmbulanciaFlota[]> {
    const orms = await this.repository.find({
      where: { estadoServicio: EstadoServicioAmbulancia.FUERA_SERVICIO },
      order: { vehiculoId: 'ASC' },
    });
    return orms.map(AmbulanciaFlotaMapper.toDomain);
  }

  async countEnServicio(): Promise<number> {
    return this.repository.count({ where: { estadoServicio: EstadoServicioAmbulancia.EN_SERVICIO } });
  }

  async findAllViews(_search?: string, _estadoServicio?: string) {
    return [];
  }

  async findViewByVehiculoId(_vehiculoId: number) {
    return null;
  }

  async findAllEnServicio(): Promise<AmbulanciaFlota[]> {
    const orms = await this.repository.find({ where: { estadoServicio: 'EN_SERVICIO' } });
    return orms.map(AmbulanciaFlotaMapper.toDomain);
  }

  async findAll(): Promise<AmbulanciaFlota[]> {
    const orms = await this.repository.find();
    return orms.map(AmbulanciaFlotaMapper.toDomain);
  }
}

@Injectable()
export class TypeOrmPlantillaFlotaRepository extends BaseSource implements PlantillaFlotaRepository {
  private get repository() {
    return repo(this, AmbPlantillaOrm);
  }

  async save(entity: PlantillaFlota): Promise<PlantillaFlota> {
    const saved = await this.repository.save(PlantillaFlotaMapper.toOrm(entity));
    return PlantillaFlotaMapper.toDomain(saved);
  }

  async update(entity: PlantillaFlota): Promise<PlantillaFlota> {
    return this.save(entity);
  }

  async findVigenteByFormato(formato: FormatoPlantilla): Promise<PlantillaFlota | null> {
    const orm = await this.repository.findOne({ where: { formato, vigente: true } });
    return orm ? PlantillaFlotaMapper.toDomain(orm) : null;
  }

  async findById(id: number): Promise<PlantillaFlota | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? PlantillaFlotaMapper.toDomain(orm) : null;
  }

  async findVersionesByFormato(formato: FormatoPlantilla): Promise<PlantillaView[]> {
    const orms = await this.repository.find({ where: { formato }, order: { version: 'DESC' } });
    return orms.map(PlantillaFlotaMapper.toView);
  }

  async findMaxVersion(formato: FormatoPlantilla): Promise<number> {
    const row = await this.repository
      .createQueryBuilder('p')
      .select('MAX(p.version)', 'max')
      .where('p.formato = :formato', { formato })
      .getRawOne();
    return Number(row?.max ?? 0);
  }

  async clearVigente(formato: FormatoPlantilla): Promise<void> {
    await this.repository.update({ formato, vigente: true }, { vigente: false });
  }

  async findByIds(ids: number[]): Promise<PlantillaFlota[]> {
    if (!ids.length) return [];
    const orms = await this.repository.find({ where: { id: In(ids) } });
    return orms.map(PlantillaFlotaMapper.toDomain);
  }
}

@Injectable()
export class TypeOrmTurnoFlotaRepository extends BaseSource implements TurnoFlotaRepository {
  private get repository() {
    return repo(this, AmbTurnoOrm);
  }

  async save(entity: TurnoFlota): Promise<TurnoFlota> {
    const saved = await this.repository.save(TurnoFlotaMapper.toOrm(entity));
    return TurnoFlotaMapper.toDomain(saved);
  }

  async update(entity: TurnoFlota): Promise<TurnoFlota> {
    return this.save(entity);
  }

  async findById(id: number): Promise<TurnoFlota | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? TurnoFlotaMapper.toDomain(orm) : null;
  }

  async findActivoByVehiculo(vehiculoId: number): Promise<TurnoFlota | null> {
    const orm = await this.repository.findOne({
      where: { vehiculoId, estado: In([EstadoTurno.ACTIVO, EstadoTurno.ENTREGADO]) },
    });
    return orm ? TurnoFlotaMapper.toDomain(orm) : null;
  }

  async findVigenteByResponsable(responsableId: number): Promise<TurnoFlota | null> {
    const orm = await this.repository.findOne({
      where: { responsableId, estado: In([EstadoTurno.ACTIVO, EstadoTurno.ENTREGADO]) },
    });
    return orm ? TurnoFlotaMapper.toDomain(orm) : null;
  }

  async findActivos(): Promise<TurnoFlota[]> {
    const orms = await this.repository.find({
      where: { estado: In([EstadoTurno.ACTIVO, EstadoTurno.ENTREGADO]) },
    });
    return orms.map(TurnoFlotaMapper.toDomain);
  }

  async findActivosOrdered(): Promise<TurnoFlota[]> {
    const orms = await this.repository.find({
      where: { estado: In([EstadoTurno.ACTIVO, EstadoTurno.ENTREGADO]) },
      order: { fechaInicio: 'DESC' },
    });
    return orms.map(TurnoFlotaMapper.toDomain);
  }

  async findUltimaFechaFinByVehiculos(vehiculoIds: number[]): Promise<Map<number, Date>> {
    const map = new Map<number, Date>();
    if (!vehiculoIds.length) return map;
    const rows = await this.repository
      .createQueryBuilder('t')
      .select('t.vehiculoId', 'vehiculoId')
      .addSelect('MAX(t.fechaFin)', 'fechaFin')
      .where('t.vehiculoId IN (:...ids)', { ids: vehiculoIds })
      .andWhere('t.fechaFin IS NOT NULL')
      .groupBy('t.vehiculoId')
      .getRawMany();
    for (const row of rows) {
      if (row.fechaFin) map.set(Number(row.vehiculoId), new Date(row.fechaFin));
    }
    return map;
  }

  async findMiTurno(usuarioId: number): Promise<TurnoFlota[]> {
    const orms = await this.repository.find({
      where: [
        { responsableId: usuarioId, estado: EstadoTurno.ACTIVO },
        { responsableId: usuarioId, estado: EstadoTurno.ENTREGADO },
        { responsableId: usuarioId, estado: EstadoTurno.CERRADO },
      ],
      order: { fechaInicio: 'DESC' },
    });
    return orms.map(TurnoFlotaMapper.toDomain);
  }

  async findActivosViews(): Promise<never> {
    throw new Error('Use FlotaViewBuilderService');
  }

  async findViewById(): Promise<never> {
    throw new Error('Use FlotaViewBuilderService');
  }

  async search(params: {
    vehiculoId?: number;
    estado?: EstadoTurno;
    desde?: Date;
    hasta?: Date;
    page: number;
    pageSize: number;
    searchScope?: FlotaSearchScope;
  }): Promise<[TurnoFlota[], number]> {
    const qb = this.repository.createQueryBuilder('t');
    if (params.vehiculoId) qb.andWhere('t.vehiculoId = :vid', { vid: params.vehiculoId });
    if (params.estado) qb.andWhere('t.estado = :estado', { estado: params.estado });
    if (params.desde) qb.andWhere('t.fechaInicio >= :desde', { desde: params.desde });
    if (params.hasta) qb.andWhere('t.fechaInicio <= :hasta', { hasta: params.hasta });
    applySearchScope(qb, 't', params.searchScope, 'vehiculoId', 'responsableId');
    qb.orderBy('t.fechaInicio', 'DESC');
    qb.skip((params.page - 1) * params.pageSize).take(params.pageSize);
    const [orms, count] = await qb.getManyAndCount();
    return [orms.map(TurnoFlotaMapper.toDomain), count];
  }
}

@Injectable()
export class TypeOrmEntregaFlotaRepository extends BaseSource implements EntregaFlotaRepository {
  private get repository() {
    return repo(this, AmbEntregaOrm);
  }

  async save(entity: EntregaFlota): Promise<EntregaFlota> {
    const saved = await this.repository.save(EntregaFlotaMapper.toOrm(entity));
    return EntregaFlotaMapper.toDomain(saved);
  }

  async update(entity: EntregaFlota): Promise<EntregaFlota> {
    return this.save(entity);
  }

  async findById(id: number): Promise<EntregaFlota | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? EntregaFlotaMapper.toDomain(orm) : null;
  }

  async findByTurnoSaliente(turnoSalienteId: number): Promise<EntregaFlota | null> {
    const orm = await this.repository.findOne({ where: { turnoSalienteId } });
    return orm ? EntregaFlotaMapper.toDomain(orm) : null;
  }

  async findViewById(): Promise<never> {
    throw new Error('Use FlotaViewBuilderService');
  }

  async findByTurnoSalienteIds(turnoIds: number[]): Promise<EntregaFlota[]> {
    if (!turnoIds.length) return [];
    const orms = await this.repository.find({ where: { turnoSalienteId: In(turnoIds) } });
    return orms.map(EntregaFlotaMapper.toDomain);
  }

  async findByTurnoEntrante(turnoEntranteId: number): Promise<EntregaFlota | null> {
    const orm = await this.repository.findOne({ where: { turnoEntranteId } });
    return orm ? EntregaFlotaMapper.toDomain(orm) : null;
  }

  async findDisponiblesParaRecibir(usuarioId: number, now: Date): Promise<EntregaFlota[]> {
    const orms = await this.repository
      .createQueryBuilder('e')
      .innerJoin(AmbTurnoOrm, 't', 't.id = e.turnoSalienteId')
      .where('e.estado = :abierta', { abierta: EstadoEntrega.ABIERTA })
      .andWhere('e.turnoEntranteId IS NULL')
      .andWhere('t.responsableId <> :uid', { uid: usuarioId })
      .andWhere(
        new Brackets(qb => {
          qb.where(
            '(t.estado = :entregado AND e.fechaEntrega IS NOT NULL AND e.limiteInicioRecepcion > :now)',
            { entregado: EstadoTurno.ENTREGADO, now },
          ).orWhere(
            '(t.estado = :activo AND e.fechaEntrega IS NULL AND e.habilitaExcepcionalEn <= :now AND e.cierreAutomaticoEn > :now)',
            { activo: EstadoTurno.ACTIVO },
          );
        }),
      )
      .getMany();
    return orms.map(EntregaFlotaMapper.toDomain);
  }
}

@Injectable()
export class TypeOrmEntregaDeclFlotaRepository extends BaseSource implements EntregaDeclFlotaRepository {
  private get repository() {
    return repo(this, AmbEntregaDeclOrm);
  }

  async save(entity: EntregaDeclaracion): Promise<EntregaDeclaracion> {
    const saved = await this.repository.save(EntregaDeclMapper.toOrm(entity));
    return EntregaDeclMapper.toDomain(saved);
  }

  async update(entity: EntregaDeclaracion): Promise<EntregaDeclaracion> {
    return this.save(entity);
  }

  async findById(id: number): Promise<EntregaDeclaracion | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? EntregaDeclMapper.toDomain(orm) : null;
  }

  async findByEntregaAndRol(entregaId: number, rol: string): Promise<EntregaDeclaracion | null> {
    const orm = await this.repository.findOne({ where: { entregaId, rol } });
    return orm ? EntregaDeclMapper.toDomain(orm) : null;
  }

  async findByEntregaId(entregaId: number): Promise<EntregaDeclaracion[]> {
    const orms = await this.repository.find({ where: { entregaId } });
    return orms.map(EntregaDeclMapper.toDomain);
  }

  async bloquear(id: number): Promise<void> {
    if (!TypeOrmTransactionContext.getQueryRunner()) return;
    await this.repository
      .createQueryBuilder('x')
      .select('x.id')
      .where('x.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();
  }
}

@Injectable()
export class TypeOrmLimpiezaFlotaRepository extends BaseSource implements LimpiezaFlotaRepository {
  private get repository() {
    return repo(this, AmbLimpiezaOrm);
  }

  async save(entity: LimpiezaFlota): Promise<LimpiezaFlota> {
    const saved = await this.repository.save(LimpiezaFlotaMapper.toOrm(entity));
    return LimpiezaFlotaMapper.toDomain(saved);
  }

  async update(entity: LimpiezaFlota): Promise<LimpiezaFlota> {
    return this.save(entity);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async findById(id: number): Promise<LimpiezaFlota | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? LimpiezaFlotaMapper.toDomain(orm) : null;
  }

  async bloquear(id: number): Promise<void> {
    if (!TypeOrmTransactionContext.getQueryRunner()) return;
    await this.repository
      .createQueryBuilder('x')
      .select('x.id')
      .where('x.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();
  }

  async findViewById(): Promise<never> {
    throw new Error('Use FlotaViewBuilderService');
  }

  async findBorradorByTurno(turnoId: number): Promise<LimpiezaFlota | null> {
    const orm = await this.repository.findOne({ where: { turnoId, estado: EstadoLimpieza.BORRADOR } });
    return orm ? LimpiezaFlotaMapper.toDomain(orm) : null;
  }

  async findByTurno(turnoId: number): Promise<LimpiezaFlota[]> {
    const orms = await this.repository.find({ where: { turnoId } });
    return orms.map(LimpiezaFlotaMapper.toDomain);
  }

  async search(params: {
    vehiculoId?: number;
    turnoId?: number;
    estado?: EstadoLimpieza;
    desde?: Date;
    hasta?: Date;
    page: number;
    pageSize: number;
    searchScope?: FlotaSearchScope;
  }): Promise<[LimpiezaFlota[], number]> {
    const qb = this.repository.createQueryBuilder('l');
    if (params.vehiculoId) qb.andWhere('l.vehiculoId = :vid', { vid: params.vehiculoId });
    if (params.turnoId) qb.andWhere('l.turnoId = :tid', { tid: params.turnoId });
    if (params.estado) qb.andWhere('l.estado = :estado', { estado: params.estado });
    if (params.desde) qb.andWhere('l.createdAt >= :desde', { desde: params.desde });
    if (params.hasta) qb.andWhere('l.createdAt <= :hasta', { hasta: params.hasta });
    applySearchScope(qb, 'l', params.searchScope, 'vehiculoId', 'usuarioId');
    qb.orderBy('l.id', 'DESC');
    qb.skip((params.page - 1) * params.pageSize).take(params.pageSize);
    const [orms, count] = await qb.getManyAndCount();
    return [orms.map(LimpiezaFlotaMapper.toDomain), count];
  }
}

@Injectable()
export class TypeOrmDotacionFlotaRepository extends BaseSource implements DotacionFlotaRepository {
  private get repository() {
    return repo(this, AmbDotacionOrm);
  }

  async save(entity: DotacionFlota): Promise<DotacionFlota> {
    const saved = await this.repository.save(DotacionFlotaMapper.toOrm(entity));
    return DotacionFlotaMapper.toDomain(saved);
  }

  async update(entity: DotacionFlota): Promise<DotacionFlota> {
    return this.save(entity);
  }

  async bloquear(id: number): Promise<void> {
    if (!TypeOrmTransactionContext.getQueryRunner()) return;
    await this.repository
      .createQueryBuilder('x')
      .select('x.id')
      .where('x.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async findById(id: number): Promise<DotacionFlota | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? DotacionFlotaMapper.toDomain(orm) : null;
  }

  async findViewById(): Promise<never> {
    throw new Error('Use FlotaViewBuilderService');
  }

  async findByVehiculoAndFecha(vehiculoId: number, fecha: string): Promise<DotacionFlota | null> {
    const orm = await this.repository.findOne({ where: { vehiculoId, fecha } });
    return orm ? DotacionFlotaMapper.toDomain(orm) : null;
  }

  async findByFecha(fecha: string): Promise<DotacionFlota[]> {
    const orms = await this.repository.find({ where: { fecha } });
    return orms.map(DotacionFlotaMapper.toDomain);
  }

  async findByFechaRange(desde: string, hasta: string): Promise<DotacionFlota[]> {
    const orms = await this.repository
      .createQueryBuilder('d')
      .where('d.fecha >= :desde', { desde })
      .andWhere('d.fecha <= :hasta', { hasta })
      .getMany();
    return orms.map(DotacionFlotaMapper.toDomain);
  }

  async findByVehiculoAndFechaRange(vehiculoId: number, desde: string, hasta: string): Promise<DotacionFlota[]> {
    const orms = await this.repository
      .createQueryBuilder('d')
      .where('d.vehiculoId = :vid', { vid: vehiculoId })
      .andWhere('d.fecha >= :desde', { desde })
      .andWhere('d.fecha <= :hasta', { hasta })
      .getMany();
    return orms.map(DotacionFlotaMapper.toDomain);
  }

  async countByFecha(fecha: string): Promise<number> {
    return this.repository.count({ where: { fecha } });
  }

  async findEnCursoVencidasEnRango(desde: string, hasta: string, now: Date): Promise<DotacionFlota[]> {
    const orms = await this.repository
      .createQueryBuilder('d')
      .where('d.fecha >= :desde', { desde })
      .andWhere('d.fecha <= :hasta', { hasta })
      .andWhere('d.estado = :estado', { estado: EstadoDotacion.EN_CURSO })
      .andWhere('d.fechaLimite IS NOT NULL')
      .andWhere('d.fechaLimite < :now', { now })
      .andWhere('d.bloqueada = :bloq', { bloq: false })
      .getMany();
    return orms.map(DotacionFlotaMapper.toDomain);
  }

  async search(params: {
    vehiculoId?: number;
    desde?: string;
    hasta?: string;
    estado?: EstadoDotacion;
    completa?: boolean;
    page: number;
    pageSize: number;
    searchScope?: FlotaSearchScope;
  }): Promise<[DotacionFlota[], number]> {
    const qb = this.repository.createQueryBuilder('d');
    if (params.vehiculoId) qb.andWhere('d.vehiculoId = :vid', { vid: params.vehiculoId });
    if (params.desde) qb.andWhere('d.fecha >= :desde', { desde: params.desde });
    if (params.hasta) qb.andWhere('d.fecha <= :hasta', { hasta: params.hasta });
    if (params.estado) qb.andWhere('d.estado = :estado', { estado: params.estado });
    if (params.completa !== undefined) qb.andWhere('d.completa = :completa', { completa: params.completa });
    applySearchScope(qb, 'd', params.searchScope, 'vehiculoId', 'usuarioId');
    qb.orderBy('d.fecha', 'DESC').addOrderBy('d.id', 'DESC');
    qb.skip((params.page - 1) * params.pageSize).take(params.pageSize);
    const [orms, count] = await qb.getManyAndCount();
    return [orms.map(DotacionFlotaMapper.toDomain), count];
  }
}

@Injectable()
export class TypeOrmDotacionNovedadRepository extends BaseSource implements DotacionNovedadRepository {
  private get repository() {
    return repo(this, AmbDotacionNovedadOrm);
  }

  async save(entity: DotacionNovedad): Promise<DotacionNovedad> {
    const saved = await this.repository.save(DotacionNovedadMapper.toOrm(entity));
    return DotacionNovedadMapper.toDomain(saved);
  }

  async update(entity: DotacionNovedad): Promise<DotacionNovedad> {
    return this.save(entity);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async findById(id: number): Promise<DotacionNovedad | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? DotacionNovedadMapper.toDomain(orm) : null;
  }

  async findByDotacion(dotacionId: number): Promise<DotacionNovedad[]> {
    const orms = await this.repository.find({ where: { dotacionId } });
    return orms.map(DotacionNovedadMapper.toDomain);
  }

  async findByDotacionAndKey(dotacionId: number, itemKey: string): Promise<DotacionNovedad | null> {
    const orm = await this.repository.findOne({ where: { dotacionId, itemKey } });
    return orm ? DotacionNovedadMapper.toDomain(orm) : null;
  }

  async countAbiertasGlobal(): Promise<number> {
    return this.repository.count({ where: { estado: EstadoNovedadDotacion.ABIERTA } });
  }

  async countByDotacionIds(dotacionIds: number[]): Promise<Map<number, { abiertas: number; total: number }>> {
    const map = new Map<number, { abiertas: number; total: number }>();
    if (!dotacionIds.length) return map;
    const rows = await this.repository
      .createQueryBuilder('n')
      .select('n.dotacionId', 'dotacionId')
      .addSelect('COUNT(*)', 'total')
      .addSelect(`SUM(CASE WHEN n.estado = :abierta THEN 1 ELSE 0 END)`, 'abiertas')
      .where('n.dotacionId IN (:...ids)', { ids: dotacionIds })
      .setParameter('abierta', EstadoNovedadDotacion.ABIERTA)
      .groupBy('n.dotacionId')
      .getRawMany();
    for (const row of rows) {
      map.set(Number(row.dotacionId), {
        total: Number(row.total),
        abiertas: Number(row.abiertas ?? 0),
      });
    }
    return map;
  }

  async search(params: {
    estado?: string;
    vehiculoId?: number;
    desde?: Date;
    hasta?: Date;
    page: number;
    pageSize: number;
  }): Promise<[DotacionNovedad[], number]> {
    const qb = this.repository.createQueryBuilder('n').innerJoin(AmbDotacionOrm, 'd', 'd.id = n.dotacionId');
    if (params.estado) qb.andWhere('n.estado = :estado', { estado: params.estado });
    if (params.vehiculoId) qb.andWhere('d.vehiculoId = :vehiculoId', { vehiculoId: params.vehiculoId });
    qb.orderBy('n.id', 'DESC');
    qb.skip((params.page - 1) * params.pageSize).take(params.pageSize);
    const [orms, count] = await qb.getManyAndCount();
    return [orms.map(DotacionNovedadMapper.toDomain), count];
  }
}

@Injectable()
export class TypeOrmElementoVencFlotaRepository extends BaseSource implements ElementoVencFlotaRepository {
  private get repository() {
    return repo(this, AmbElementoVencOrm);
  }

  async upsert(entity: ElementoVencFlota): Promise<void> {
    await this.repository.save(ElementoVencMapper.toOrm(entity));
  }

  async findByVehiculo(vehiculoId: number): Promise<ElementoVencFlota[]> {
    const orms = await this.repository.find({ where: { vehiculoId } });
    return orms.map(ElementoVencMapper.toDomain);
  }

  async findByVehiculoAndKey(vehiculoId: number, itemKey: string): Promise<ElementoVencFlota | null> {
    const orm = await this.repository.findOne({ where: { vehiculoId, itemKey } });
    return orm ? ElementoVencMapper.toDomain(orm) : null;
  }
}

@Injectable()
export class TypeOrmEventoFlotaRepository extends BaseSource implements EventoFlotaRepository {
  private get repository() {
    return repo(this, AmbEventoOrm);
  }

  async append(entity: EventoFlota): Promise<EventoFlota> {
    const saved = await this.repository.save(EventoFlotaMapper.toOrm(entity));
    return EventoFlotaMapper.toDomain(saved);
  }

  async findByEntidad(entidad: string, entidadId: number) {
    const orms = await this.repository.find({
      where: { entidad, entidadId },
      order: { createdAt: 'ASC' },
    });
    return orms.map(EventoFlotaMapper.toDomain);
  }

  async findUltimoPorTipo(entidad: string, entidadId: number, tipoEvento: string): Promise<EventoFlota | null> {
    const orm = await this.repository.findOne({
      where: { entidad, entidadId, tipoEvento },
      order: { createdAt: 'DESC' },
    });
    return orm ? EventoFlotaMapper.toDomain(orm) : null;
  }

  async findUltimosFueraServicioByAmbulanciaIds(ambulanciaIds: number[]): Promise<Map<number, EventoFlota>> {
    const map = new Map<number, EventoFlota>();
    if (!ambulanciaIds.length) return map;
    for (const id of ambulanciaIds) {
      const ev = await this.findUltimoPorTipo('AMBULANCIA', id, 'FUERA_SERVICIO');
      if (ev) map.set(id, ev);
    }
    return map;
  }

  async findServicioByAmbulanciaIds(
    ambulanciaIds: number[],
  ): Promise<Map<number, Array<{ tipoEvento: string; createdAt: Date }>>> {
    const map = new Map<number, Array<{ tipoEvento: string; createdAt: Date }>>();
    if (!ambulanciaIds.length) return map;
    const orms = await this.repository.find({
      where: {
        entidad: EntidadEventoFlota.AMBULANCIA,
        entidadId: In(ambulanciaIds),
        tipoEvento: In(['REGISTRADA', 'FUERA_SERVICIO', 'EN_SERVICIO']),
      },
      order: { createdAt: 'ASC' },
    });
    for (const o of orms) {
      const list = map.get(o.entidadId) ?? [];
      list.push({ tipoEvento: o.tipoEvento, createdAt: o.createdAt });
      map.set(o.entidadId, list);
    }
    return map;
  }
}

import { BadInputError } from '@common/domain/errors';
import {
  buildResumenTanqueos,
  filtersPeriodoAnterior,
} from '@vehiculos/domain/helpers/resumen-tanqueos.helper';
import { TanqueoResumenRow } from '@vehiculos/domain/types/tanqueo-resumen-row.type';
import { TANQUEO_CONTEXTOS_GLOBALES } from '../tanqueo-contextos-globales';
import { BaseSource } from '@common/infrastructure/services';
import { Tanqueo } from '@vehiculos/domain/entities';
import { EstadoTanqueo } from '@vehiculos/domain/enums';
import { ResumenTanqueosRead, TanqueoRead } from '@vehiculos/domain/reads';
import { TanqueoFilters, TanqueoRepository } from '@vehiculos/domain/repositories';
import { TanqueoMapper } from '@vehiculos/infrastructure/mappers';
import {
  fetchEstacionesById,
  fetchVehiculoIdsBy,
  fetchVehiculosById,
  hasVehiculoIdFiltro,
} from '../eklipse-refs';
import { TanqueoInconsistenciaOrm, TanqueoOrm } from '../orm';
import {
  runVehiculosPersist,
  scopeForTanqueo,
} from '../errors/vehiculos-persistence.error';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { resolveRepository } from '@common/infrastructure/persistence/transactional';

export class TypeOrmTanqueoRepository extends BaseSource implements TanqueoRepository {
  private get repository() {
    return resolveRepository(this.conn, TanqueoOrm);
  }

  private get inconsistenciaRepository() {
    return resolveRepository(this.conn, TanqueoInconsistenciaOrm);
  }

  async save(tanqueo: Tanqueo): Promise<Tanqueo> {
    return runVehiculosPersist(scopeForTanqueo(tanqueo.getOrigen), async () => {
      const saved = await this.repository.save(TanqueoMapper.toOrm(tanqueo));
      return TanqueoMapper.toDomain(saved);
    });
  }

  async findById(id: number): Promise<Tanqueo | null> {
    const orm = await this.repository.findOne({
      where: { id },

      relations: this.getRelations(),
    });

    return orm ? TanqueoMapper.toDomain(orm) : null;
  }

  async update(tanqueo: Tanqueo): Promise<Tanqueo> {
    if (!tanqueo.getId?.getValor) return null;

    const orm = TanqueoMapper.toUpdateOrm(tanqueo);

    await this.repository.save(orm);

    return this.findById(tanqueo.getId.getValor);
  }

  async delete(id: number): Promise<void> {
    throw new Error('Los tanqueos no se pueden eliminar físicamente');
  }

  async exists(id: number): Promise<boolean> {
    return await this.repository.exists({ where: { id } });
  }

  async findViewById(id: number): Promise<TanqueoRead | null> {
    const orm = await this.repository.findOne({
      where: { id },

      relations: this.getRelations(),
    });

    return orm ? (await this.toViews([orm]))[0] : null;
  }

  async findAllView(page: number, limit: number): Promise<[TanqueoRead[], number]> {
    throw new Error('no implemented');
  }

  async findAllAndCount(
    page: number,

    limit: number,

    filters?: TanqueoFilters
  ): Promise<[TanqueoRead[], number]> {
    const qb = this.baseQbRelations();

    await this.applyFilters(qb, filters);

    qb.orderBy('tanqueo.fechaTanqueo', 'DESC');

    qb.take(limit);

    qb.skip((page - 1) * limit);

    const [items, count] = await qb.getManyAndCount();

    return [await this.toViews(items), count];
  }

  async findAllSedesAndCount(
    page: number,
    limit: number,
    filters?: TanqueoFilters
  ): Promise<[TanqueoRead[], number]> {
    const cantidadPorSede = page * limit;
    const resultados = await Promise.all(
      TANQUEO_CONTEXTOS_GLOBALES.map(async contexto => {
        const repository = resolveRepository(this.dynamicConn(contexto), TanqueoOrm);
        const qb = this.baseQbRelations(repository);

        await this.applyFilters(qb, filters);
        qb.orderBy('tanqueo.fechaTanqueo', 'DESC').take(cantidadPorSede);

        const [orms, count] = await qb.getManyAndCount();
        const items = await this.toViews(orms);

        for (const item of items) {
          item.contexto = contexto.getCode();
          item.contextoNombre = contexto.getForHumans();
        }
        return { items, count };
      })
    );

    const count = resultados.reduce((total, sede) => total + sede.count, 0);
    const items = resultados
      .flatMap(sede => sede.items)
      .sort((a, b) => b.fechaTanqueo.getTime() - a.fechaTanqueo.getTime())
      .slice((page - 1) * limit, page * limit);

    return [items, count];
  }

  async findUltimoKilometrajePorVehiculo(vehiculoId: number): Promise<number | null> {
    return this.findUltimoKilometraje(vehiculoId, false);
  }

  async findUltimoKilometrajeAprobado(activoId: number): Promise<number | null> {
    return this.findUltimoKilometraje(activoId, true);
  }

  private async findUltimoKilometraje(
    activoId: number,
    soloAprobados: boolean
  ): Promise<number | null> {
    const qb = this.repository
      .createQueryBuilder('tanqueo')
      .select('tanqueo.KILOMETRAJE', 'kilometraje')
      .where('tanqueo.ACTIVOOID = :activoId', { activoId })
      .andWhere('tanqueo.KILOMETRAJE IS NOT NULL');
    if (soloAprobados) {
      qb.andWhere('tanqueo.ESTADO = :estado', { estado: EstadoTanqueo.APROBADO });
    } else {
      qb.andWhere('tanqueo.ESTADO != :estadoRechazado', {
        estadoRechazado: EstadoTanqueo.RECHAZADO,
      });
    }
    const result = await qb
      .orderBy('tanqueo.FECHTANQUEO', 'DESC')
      .limit(1)
      .getRawOne<{ kilometraje: number }>();
    return result?.kilometraje ?? null;
  }

  async getPromedioValorPorActivo(
    activoId: number
  ): Promise<{ promedio: number; muestra: number }> {
    const row = await this.repository
      .createQueryBuilder('tanqueo')
      .select('AVG(tanqueo.VALORPAGADO)', 'promedio')
      .addSelect('COUNT(tanqueo.OID)', 'muestra')
      .where('tanqueo.ACTIVOOID = :activoId', { activoId })
      .andWhere('tanqueo.VALORPAGADO IS NOT NULL')
      .andWhere('tanqueo.ESTADO != :estadoRechazado', { estadoRechazado: EstadoTanqueo.RECHAZADO })
      .getRawOne<{ promedio: string; muestra: string }>();
    return {
      promedio: Number(row?.promedio ?? 0),
      muestra: Number(row?.muestra ?? 0),
    };
  }

  async existsDuplicadoSospechoso(params: {
    activoId: number;
    valorPagado: number;
    fechaTanqueo: Date;
    ventanaMinutos: number;
    excludeClienteUuid?: string | null;
  }): Promise<boolean> {
    const desde = new Date(params.fechaTanqueo.getTime() - params.ventanaMinutos * 60 * 1000);
    const hasta = new Date(params.fechaTanqueo.getTime() + params.ventanaMinutos * 60 * 1000);
    const qb = this.repository
      .createQueryBuilder('tanqueo')
      .where('tanqueo.ACTIVOOID = :activoId', { activoId: params.activoId })
      .andWhere('tanqueo.VALORPAGADO = :valor', { valor: params.valorPagado })
      .andWhere('tanqueo.FECHTANQUEO BETWEEN :desde AND :hasta', { desde, hasta })
      .andWhere('tanqueo.ESTADO != :estadoRechazado', { estadoRechazado: EstadoTanqueo.RECHAZADO });
    if (params.excludeClienteUuid) {
      qb.andWhere('(tanqueo.CLIENTEUUID IS NULL OR tanqueo.CLIENTEUUID != :uuid)', {
        uuid: params.excludeClienteUuid,
      });
    }
    return (await qb.getCount()) > 0;
  }

  async findByClienteUuid(clienteUuid: string): Promise<TanqueoRead | null> {
    const orm = await this.baseQbRelations()

      .where('tanqueo.CLIENTEUUID = :clienteUuid', { clienteUuid })

      .getOne();

    return orm ? (await this.toViews([orm]))[0] : null;
  }

  async findViewByCodigo(codigo: string): Promise<TanqueoRead | null> {
    const orm = await this.repository.findOne({
      where: { codigo },

      relations: this.getRelations(),
    });

    return orm ? (await this.toViews([orm]))[0] : null;
  }

  async getResumen(filters?: TanqueoFilters): Promise<ResumenTanqueosRead> {
    return this.resolveResumen('tenant', filters);
  }

  async getResumenAllSedes(filters?: TanqueoFilters): Promise<ResumenTanqueosRead> {
    return this.resolveResumen('allSedes', filters);
  }

  private async resolveResumen(
    scope: 'tenant' | 'allSedes',
    filters?: TanqueoFilters
  ): Promise<ResumenTanqueosRead> {
    const fetchRows = (f?: TanqueoFilters) =>
      scope === 'allSedes'
        ? this.fetchResumenRowsAllSedes(f)
        : this.fetchResumenRows(this.repository, f);

    const rows = await fetchRows(filters);
    const prevFilters = filters ? filtersPeriodoAnterior(filters) : null;
    const rowsAnterior = prevFilters != null ? await fetchRows(prevFilters) : undefined;

    const vehiculos = await fetchVehiculosById(
      this.ekConn,
      rows.map(r => r.activoId)
    );
    const placas = new Map<number, string>();
    for (const [id, v] of vehiculos) {
      placas.set(id, v.placa);
    }

    return buildResumenTanqueos(rows, placas, filters, rowsAnterior);
  }

  private async fetchResumenRowsAllSedes(filters?: TanqueoFilters): Promise<TanqueoResumenRow[]> {
    const chunks = await Promise.all(
      TANQUEO_CONTEXTOS_GLOBALES.map(contexto =>
        this.fetchResumenRows(resolveRepository(this.dynamicConn(contexto), TanqueoOrm), filters)
      )
    );
    return chunks.flat();
  }

  private async fetchResumenRows(
    repository: Repository<TanqueoOrm>,
    filters?: TanqueoFilters
  ): Promise<TanqueoResumenRow[]> {
    const qb = repository
      .createQueryBuilder('tanqueo')
      .leftJoin('tanqueo.usuario', 'usuario')
      .select('tanqueo.activoId', 'activoId')
      .addSelect('tanqueo.tipoCombustible', 'tipoCombustible')
      .addSelect('tanqueo.valorTotalPagado', 'valorTotalPagado')
      .addSelect('tanqueo.cantidadCombustible', 'cantidadCombustible')
      .addSelect('tanqueo.unidadMedidaCombustible', 'unidadMedidaCombustible')
      .addSelect('tanqueo.kilometrosRecorridos', 'kilometrosRecorridos')
      .addSelect('tanqueo.rendimiento', 'rendimiento')
      .addSelect('tanqueo.fechaTanqueo', 'fechaTanqueo')
      .addSelect('tanqueo.estado', 'estado')
      .addSelect('tanqueo.origen', 'origen');

    await this.applyFilters(qb, filters);

    const raw = await qb.getRawMany<{
      activoId: number;
      tipoCombustible: TanqueoResumenRow['tipoCombustible'];
      valorTotalPagado: string | null;
      cantidadCombustible: string | null;
      unidadMedidaCombustible: TanqueoResumenRow['unidadMedidaCombustible'];
      kilometrosRecorridos: number | null;
      rendimiento: string | null;
      fechaTanqueo: Date;
      estado: TanqueoResumenRow['estado'];
      origen: TanqueoResumenRow['origen'];
    }>();

    return raw.map(r => ({
      activoId: Number(r.activoId),
      tipoCombustible: r.tipoCombustible,
      valorTotalPagado: r.valorTotalPagado != null ? Number(r.valorTotalPagado) : null,
      cantidadCombustible: r.cantidadCombustible != null ? Number(r.cantidadCombustible) : null,
      unidadMedidaCombustible: r.unidadMedidaCombustible,
      kilometrosRecorridos: r.kilometrosRecorridos,
      rendimiento: r.rendimiento != null ? Number(r.rendimiento) : null,
      fechaTanqueo: r.fechaTanqueo,
      estado: r.estado,
      origen: r.origen,
    }));
  }

  async changeEstado(tanqueo: Tanqueo): Promise<void> {
    await this.repository.save(TanqueoMapper.toUpdateOrm(tanqueo));
  }

  async saveWithInconsistencias(tanqueo: Tanqueo): Promise<Tanqueo> {
    return runVehiculosPersist(scopeForTanqueo(tanqueo.getOrigen), async () => {
      const orm = TanqueoMapper.toOrm(tanqueo);
      const saved = await this.repository.save(orm);

      if (!saved.id) {
        throw new BadInputError('No se obtuvo id al persistir el tanqueo');
      }

      const tanqueoRef = { id: saved.id } as TanqueoOrm;
      const inconsistenciasOrm = tanqueo.getInconsistencias.map(inconsistencia => {
        const incOrm = new TanqueoInconsistenciaOrm();
        incOrm.tanqueo = tanqueoRef;
        incOrm.codigo = inconsistencia.codigo;
        incOrm.campo = inconsistencia.campo;
        incOrm.severidad = inconsistencia.severidad;
        incOrm.fechaDeteccion = new Date();
        incOrm.contactoRealizado = false;
        return incOrm;
      });

      if (inconsistenciasOrm.length > 0) {
        await this.inconsistenciaRepository.save(inconsistenciasOrm);
      }

      saved.inconsistencias = inconsistenciasOrm;
      return TanqueoMapper.toDomain(saved);
    });
  }

  async saveMany(tanqueos: Tanqueo[]): Promise<Tanqueo[]> {
    const saved: Tanqueo[] = [];

    for (const tanqueo of tanqueos) {
      saved.push(await this.saveWithInconsistencias(tanqueo));
    }

    return saved;
  }

  private async toViews(orms: TanqueoOrm[]): Promise<TanqueoRead[]> {
    if (orms.length === 0) return [];

    const [vehiculos, estaciones] = await Promise.all([
      fetchVehiculosById(
        this.ekConn,
        orms.map(orm => orm.activoId)
      ),
      fetchEstacionesById(
        this.ekConn,
        orms.map(orm => orm.estacionServicioId)
      ),
    ]);

    return TanqueoMapper.toViews(orms, vehiculos, estaciones);
  }

  private baseQbRelations(
    repository: Repository<TanqueoOrm> = this.repository
  ): SelectQueryBuilder<TanqueoOrm> {
    return repository
      .createQueryBuilder('tanqueo')

      .leftJoinAndSelect('tanqueo.usuario', 'usuario')

      .leftJoinAndSelect('tanqueo.inconsistencias', 'inconsistencias')

      .leftJoinAndSelect('inconsistencias.resueltoPorUsuario', 'resueltoPor')

      .leftJoinAndSelect('tanqueo.decididoPorUsuario', 'decididoPor')

      .leftJoinAndSelect('tanqueo.abastecimiento', 'abastecimiento')

      .leftJoinAndSelect('tanqueo.repositorio', 'repositorio');
  }

  private async applyFilters(
    qb: SelectQueryBuilder<TanqueoOrm>,

    filters?: TanqueoFilters
  ): Promise<SelectQueryBuilder<TanqueoOrm>> {
    if (filters?.activoId) {
      qb.andWhere('tanqueo.activoId = :activoId', { activoId: filters.activoId });
    }

    if (filters?.usuarioId) {
      qb.andWhere('usuario.id = :usuarioId', { usuarioId: filters.usuarioId });
    }

    if (filters?.estacionServicioId) {
      qb.andWhere('tanqueo.estacionServicioId = :estacionServicioId', {
        estacionServicioId: filters.estacionServicioId,
      });
    }

    if (filters?.tipoCombustible) {
      qb.andWhere('tanqueo.tipoCombustible = :tipoCombustible', {
        tipoCombustible: filters.tipoCombustible,
      });
    }

    if (filters?.estado) {
      qb.andWhere('tanqueo.ESTADO = :estado', { estado: filters.estado });
    }

    if (filters?.origen) {
      qb.andWhere('tanqueo.ORIGEN = :origen', { origen: filters.origen });
    }

    if (filters?.fechaDesde) {
      qb.andWhere('tanqueo.FECHTANQUEO >= :fechaDesde', { fechaDesde: filters.fechaDesde });
    }

    if (filters?.fechaHasta) {
      qb.andWhere('tanqueo.FECHTANQUEO <= :fechaHasta', { fechaHasta: filters.fechaHasta });
    }

    if (filters?.tieneAlertas !== undefined) {
      const existsPendiente = `EXISTS (
        SELECT 1 FROM GCNTANQUEOINCONS inc
        WHERE inc.TANQUEOOID = tanqueo.OID AND inc.FECHARESOLUCION IS NULL
      )`;
      qb.andWhere(filters.tieneAlertas ? existsPendiente : `NOT ${existsPendiente}`);
    }

    if (hasVehiculoIdFiltro(filters)) {
      const activoIds = await fetchVehiculoIdsBy(this.ekConn, {
        placa: filters.placa,
        tipoActivo: filters.tipoActivo,
      });

      qb.andWhere('tanqueo.activoId IN (:...activoIds)', {
        activoIds: activoIds.length > 0 ? activoIds : [0],
      });
    }

    return qb;
  }

  private getRelations(): string[] {
    return [
      'usuario',
      'inconsistencias',
      'inconsistencias.resueltoPorUsuario',
      'decididoPorUsuario',
      'abastecimiento',
      'repositorio',
    ];
  }
}

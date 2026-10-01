import { TipoActivo } from '@vehiculos/domain/enums';
import { DataSource, In } from 'typeorm';
import { EstacionServicioOrm, VehiculoOrm } from './orm';

const VEHICULO_RELATIONS = ['modelo', 'modelo.marca'];

export const MUNICIPIO_EK_SELECT = [
  'municipio.id',
  'municipio.codigo',
  'municipio.nombre',
  'municipio.codigoDepartamentoMunicipio',
] as const;

export const DEPARTAMENTO_EK_SELECT = [
  'departamento.id',
  'departamento.codigo',
  'departamento.nombre',
] as const;

const uniqueIds = (ids: (number | null | undefined)[]): number[] => [
  ...new Set(ids.filter((id): id is number => id != null && id > 0)),
];

export async function fetchVehiculosById(
  ekConn: DataSource,
  ids: (number | null | undefined)[]
): Promise<Map<number, VehiculoOrm>> {
  const unicos = uniqueIds(ids);
  if (unicos.length === 0) return new Map();

  const orms = await ekConn.getRepository(VehiculoOrm).find({
    where: { id: In(unicos) },
    relations: VEHICULO_RELATIONS,
  });

  return new Map(orms.map(orm => [orm.id, orm]));
}

export async function fetchEstacionesById(
  ekConn: DataSource,
  ids: (number | null | undefined)[]
): Promise<Map<number, EstacionServicioOrm>> {
  const unicos = uniqueIds(ids);
  if (unicos.length === 0) return new Map();

  const orms = await ekConn
    .getRepository(EstacionServicioOrm)
    .createQueryBuilder('estacion')
    .where('estacion.id IN (:...unicos)', { unicos })
    .leftJoin('estacion.municipio', 'municipio')
    .leftJoin('municipio.departamento', 'departamento')
    .addSelect([...MUNICIPIO_EK_SELECT, ...DEPARTAMENTO_EK_SELECT])
    .getMany();

  return new Map(orms.map(orm => [orm.id, orm]));
}

export interface VehiculoIdFiltro {
  placa?: string;
  tipoActivo?: TipoActivo;
}

export function hasVehiculoIdFiltro(filtro?: VehiculoIdFiltro): boolean {
  return !!(filtro?.placa || filtro?.tipoActivo);
}

export async function fetchVehiculoIdsBy(
  ekConn: DataSource,
  filtro: VehiculoIdFiltro
): Promise<number[]> {
  const qb = ekConn
    .getRepository(VehiculoOrm)
    .createQueryBuilder('vehiculo')
    .select('vehiculo.id', 'id');

  if (filtro.placa) {
    qb.andWhere('vehiculo.placa LIKE :placa', { placa: `%${filtro.placa}%` });
  }

  if (filtro.tipoActivo) {
    qb.andWhere('vehiculo.tipoActivo = :tipoActivo', { tipoActivo: filtro.tipoActivo });
  }

  const rows = await qb.getRawMany<{ id: number }>();

  return rows.map(row => Number(row.id));
}

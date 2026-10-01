import { EntityStatusFilter } from '@common/domain/enums';
import { SelectQueryBuilder } from 'typeorm';

function resolveStatus(estado?: EntityStatusFilter | null): EntityStatusFilter {
  return estado ?? EntityStatusFilter.ACTIVO;
}

export function applyActivoStatusToQb<T extends object>(
  qb: SelectQueryBuilder<T>,
  column: string,
  estado?: EntityStatusFilter | null,
  paramName = 'entityStatusActivo',
): void {
  const resolved = resolveStatus(estado);
  if (resolved === EntityStatusFilter.TODOS) {
    return;
  }
  qb.andWhere(`${column} = :${paramName}`, {
    [paramName]: resolved === EntityStatusFilter.ACTIVO,
  });
}

export function leftJoinAndSelectWithActivoStatus<T extends object>(
  qb: SelectQueryBuilder<T>,
  property: string,
  alias: string,
  estado?: EntityStatusFilter | null,
  column = 'activo',
): SelectQueryBuilder<T> {
  const resolved = resolveStatus(estado);
  if (resolved === EntityStatusFilter.TODOS) {
    return qb.leftJoinAndSelect(property, alias);
  }
  const paramName = `${alias}_activoStatus`;
  return qb.leftJoinAndSelect(
    property,
    alias,
    `${alias}.${column} = :${paramName}`,
    { [paramName]: resolved === EntityStatusFilter.ACTIVO },
  );
}

import { INN_AUTHORITIES } from '@authorities/inventario';
import { BaseDataScopePolicy } from '@auth/application/policies/base-data-scope.policy';
import { DataScopeType } from '@auth/domain/enums/data-scope.enum';
import { DataScopeResult } from '@auth/domain/interfaces/data-scope.interfaces';
import { DataScopeSpecs } from '@auth/domain/specifications/data-scope.specs';
import { Injectable } from '@nestjs/common';
import { RecursoOrm } from '@orm/inn/equipos/pool-recursos/recurso.orm';
import { SelectQueryBuilder } from 'typeorm';

@Injectable()
export class RecursosDataScopePolicy extends BaseDataScopePolicy<RecursoOrm> {
  protected readonly authorityGlobal = INN_AUTHORITIES.GESTION_ACTIVOS.RECURSOS.VER;

  applyScope(
    qb: SelectQueryBuilder<RecursoOrm>,
    scope: DataScopeResult,
    alias: string
  ): SelectQueryBuilder<RecursoOrm> {
    switch (scope.tipo) {
      case DataScopeType.GLOBAL:
        return DataScopeSpecs.global(qb);

      case DataScopeType.OWNER:
        return qb
          .innerJoin(`${alias}.asignaciones`, 'asig')
          .andWhere('asig.usuarioId = :scopeUsuarioId', {
            scopeUsuarioId: scope.filtros.usuarioId,
          })
          .andWhere('asig.activa = 1');

      default:
        return DataScopeSpecs.global(qb);
    }
  }
}

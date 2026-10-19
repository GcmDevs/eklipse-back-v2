import { INN_AUTHORITIES } from '@authorities/inventario';
import { BaseDataScopePolicy } from '@auth/application/policies/base-data-scope.policy';
import { DataScopeType } from '@auth/domain/enums/data-scope.enum';
import { DataScopeResult } from '@auth/domain/interfaces/data-scope.interfaces';
import { DataScopeSpecs } from '@auth/domain/specifications/data-scope.specs';
import { Injectable } from '@nestjs/common';
import { RegistroActividadOrm } from '@orm/inn/equipos';
import { SelectQueryBuilder } from 'typeorm';

@Injectable()
export class ActividadesDataScopePolicy extends BaseDataScopePolicy<RegistroActividadOrm> {
  protected readonly authorityGlobal = INN_AUTHORITIES.GESTION_ACTIVOS.ACTIVIDADES.VER;

  applyScope(
    qb: SelectQueryBuilder<RegistroActividadOrm>,
    scope: DataScopeResult,
    alias: string
  ): SelectQueryBuilder<RegistroActividadOrm> {
    switch (scope.tipo) {
      case DataScopeType.GLOBAL:
        return DataScopeSpecs.global(qb);

      case DataScopeType.OWNER:
      default:
        return DataScopeSpecs.onlyFromUsuario(qb, alias, 'tecnicoResponsableId', scope.filtros);
    }
  }
}

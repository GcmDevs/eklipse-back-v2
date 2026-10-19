import { INN_AUTHORITIES } from '@authorities/inventario';
import { BaseDataScopePolicy } from '@auth/application/policies/base-data-scope.policy';
import { DataScopeType } from '@auth/domain/enums/data-scope.enum';
import { DataScopeResult } from '@auth/domain/interfaces/data-scope.interfaces';
import { DataScopeSpecs } from '@auth/domain/specifications/data-scope.specs';
import { Injectable } from '@nestjs/common';
import { EstadoRegistroDilg } from 'apps/motor-formatos/domain';
import { RegistroDiligenciadoFmtOrm } from 'apps/motor-formatos/infrastructure';
import { SelectQueryBuilder } from 'typeorm';

@Injectable()
export class DiligenciamientoDataScopePolicy extends BaseDataScopePolicy<RegistroDiligenciadoFmtOrm> {
  protected readonly authorityGlobal = INN_AUTHORITIES.GESTION_ACTIVOS.FORMATOS.GESTIONAR;

  protected readonly authorityTeam = INN_AUTHORITIES.GESTION_ACTIVOS.FORMATOS.REVISAR;

  applyScope(
    qb: SelectQueryBuilder<RegistroDiligenciadoFmtOrm>,
    scope: DataScopeResult,
    alias: string
  ): SelectQueryBuilder<RegistroDiligenciadoFmtOrm> {
    switch (scope.tipo) {
      case DataScopeType.GLOBAL:
        return DataScopeSpecs.global(qb);

      case DataScopeType.TEAM:
        return qb.andWhere(`${alias}.estado = :scopeEstado`, {
          scopeEstado: EstadoRegistroDilg.COMPLETADO,
        });

      case DataScopeType.OWNER:
      default:
        return DataScopeSpecs.onlyFromUsuario(qb, alias, 'diligenciadoPorId', scope.filtros);
    }
  }
}

import { TRANSACTION_MANAGER } from '@common/application/services';
import { TypeOrmTransactionManagerImpl } from '@common/infrastructure/persistence/transactional';
import { AuthModule } from '@auth/auth.module';
import { FORMATO_REPOSITORY } from '@equipos/domain/repositories';
import { EquiposModule } from '@equipos/equipos.module';
import { Module } from '@nestjs/common';
import {
  DiligenciamientoService,
  EJECUCION_MANT_ITEM_REPOSITORY,
  GRUPO_EJE_MANT_REPOSITORY,
  MOTOR_FORMATOS_SERVICES,
  RegistroDilgValidatorAdapter,
} from './application';
import { DiligenciamientoDataScopePolicy } from './application/policies/diligenciamiento-data-scope.policy';
import {
  FORMATO_ENGINE_REPOSITORY,
  FORMATO_SCHEMA_QUERY,
  REGISTRO_DILIGENCIADO_REPOSITORY,
  SECCION_ANEXOS_REPOSITORY,
  SECCION_REPOSITORY,
} from './domain';
import {
  TypeOrmEjecucionMantRepository,
  TypeOrmFormatoSchemaQuery,
  TypeOrmGrupoEjecucionMantRepository,
  TypeOrmSeccionesAnexosRepository,
  TypeOrmSeccionesRepository,
} from './infrastructure';
import { TypeOrmRegistroDiligenciadoRepository } from './infrastructure/persistence/repositories/registro-diligenciado.repository.impl';
import { MOTOR_FORMATOS_CONTROLLERS } from './presentation';
import { REGISTRO_DILG_VALIDATOR_SERVICE } from '@equipos/application/services/actividades/registo-dilg.across.service';

@Module({
  imports: [AuthModule, EquiposModule],
  controllers: [...MOTOR_FORMATOS_CONTROLLERS],
  providers: [
    ...MOTOR_FORMATOS_SERVICES,
    DiligenciamientoDataScopePolicy,
    {
      provide: FORMATO_ENGINE_REPOSITORY,
      useExisting: FORMATO_REPOSITORY,
    },
    {
      provide: EJECUCION_MANT_ITEM_REPOSITORY,
      useClass: TypeOrmEjecucionMantRepository,
    },
    {
      provide: GRUPO_EJE_MANT_REPOSITORY,
      useClass: TypeOrmGrupoEjecucionMantRepository,
    },
    {
      provide: FORMATO_SCHEMA_QUERY,
      useClass: TypeOrmFormatoSchemaQuery,
    },
    {
      provide: SECCION_ANEXOS_REPOSITORY,
      useClass: TypeOrmSeccionesAnexosRepository,
    },
    {
      provide: SECCION_REPOSITORY,
      useClass: TypeOrmSeccionesRepository,
    },
    {
      provide: REGISTRO_DILIGENCIADO_REPOSITORY,
      useClass: TypeOrmRegistroDiligenciadoRepository,
    },
    {
      provide: REGISTRO_DILG_VALIDATOR_SERVICE,
      useClass: RegistroDilgValidatorAdapter,
    },
    {
      provide: TRANSACTION_MANAGER,
      useClass: TypeOrmTransactionManagerImpl,
    },
  ],
  exports: [DiligenciamientoService],
})
export class MotorFormatosModule {}

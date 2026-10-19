import { TRANSACTION_MANAGER } from '@common/application/services';
import { TypeOrmTransactionManagerImpl } from '@common/infrastructure/persistence/transactional';
import { Module } from '@nestjs/common';
import {
  VehiculosService,
  TanqueoService,
  EstacionesServicioService,
  VEHICULOS_PROVIDERS,
} from './application';
import {
  TypeOrmAbastecimientoRepository,
  TypeOrmAmbulanciaRepository,
  TypeOrmEstacionServicioRepository,
  TypeOrmIdempotencyStoreRepository,
  TypeOrmRepositorioCombustibleRepository,
  TypeOrmSyncLogRepository,
  TypeOrmTanqueoInconsistenciaRepository,
  TypeOrmTanqueoRepository,
} from './infrastructure';
import { VEHICULOS_CONTROLLERS } from './presentation';
import {
  ABASTECIMIENTO_REPOSITORY,
  ESTACION_SERVICIO_REPOSITORY,
  IDEMPOTENCY_STORE_REPOSITORY,
  REPOSITORIO_COMBUSTIBLE_REPOSITORY,
  SYNC_LOG_REPOSITORY,
  TANQUEO_INCONSISTENCIA_REPOSITORY,
  TANQUEO_REPOSITORY,
  VEHICULO_REPOSITORY,
} from './domain/repositories';

@Module({
  controllers: [...VEHICULOS_CONTROLLERS],
  providers: [
    ...VEHICULOS_PROVIDERS,
    { provide: VEHICULO_REPOSITORY, useClass: TypeOrmAmbulanciaRepository },
    { provide: ESTACION_SERVICIO_REPOSITORY, useClass: TypeOrmEstacionServicioRepository },
    { provide: TANQUEO_REPOSITORY, useClass: TypeOrmTanqueoRepository },
    {
      provide: TANQUEO_INCONSISTENCIA_REPOSITORY,
      useClass: TypeOrmTanqueoInconsistenciaRepository,
    },
    { provide: SYNC_LOG_REPOSITORY, useClass: TypeOrmSyncLogRepository },
    { provide: IDEMPOTENCY_STORE_REPOSITORY, useClass: TypeOrmIdempotencyStoreRepository },
    { provide: ABASTECIMIENTO_REPOSITORY, useClass: TypeOrmAbastecimientoRepository },
    {
      provide: REPOSITORIO_COMBUSTIBLE_REPOSITORY,
      useClass: TypeOrmRepositorioCombustibleRepository,
    },
    { provide: TRANSACTION_MANAGER, useClass: TypeOrmTransactionManagerImpl },
  ],
  exports: [TANQUEO_REPOSITORY, VehiculosService, EstacionesServicioService, TanqueoService],
})
export class VehiculosModule {}

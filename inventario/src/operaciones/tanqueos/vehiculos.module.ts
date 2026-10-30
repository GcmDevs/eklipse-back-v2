import { TRANSACTION_MANAGER } from '@common/application/services';
import { TypeOrmTransactionManagerImpl } from '@common/infrastructure/persistence/transactional';
import { TenantOverrideInterceptor } from '@common/presentation/interceptors';
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
  TypeOrmLecturaOdometroRepository,
  TypeOrmRepositorioCombustibleRepository,
  TypeOrmSyncLogRepository,
  TypeOrmTanqueoCorreccionRepository,
  TypeOrmTanqueoEvidenciaLogRepository,
  TypeOrmTanqueoEventoLogRepository,
  TypeOrmTanqueoInconsistenciaRepository,
  TypeOrmTanqueoIntentoRepository,
  TypeOrmTanqueoRepository,
} from './infrastructure';
import { VEHICULOS_CONTROLLERS } from './presentation';
import {
  ABASTECIMIENTO_REPOSITORY,
  ESTACION_SERVICIO_REPOSITORY,
  LECTURA_ODOMETRO_REPOSITORY,
  REPOSITORIO_COMBUSTIBLE_REPOSITORY,
  SYNC_LOG_REPOSITORY,
  TANQUEO_INCONSISTENCIA_REPOSITORY,
  TANQUEO_REPOSITORY,
  VEHICULO_REPOSITORY,
  TANQUEO_CORRECCION_REPOSITORY,
  TANQUEO_INTENTO_REPOSITORY,
  TANQUEO_EVIDENCIA_LOG_REPOSITORY,
  TANQUEO_EVENTO_LOG_REPOSITORY,
} from './domain/repositories';

@Module({
  controllers: [...VEHICULOS_CONTROLLERS],
  providers: [
    TenantOverrideInterceptor,
    ...VEHICULOS_PROVIDERS,
    { provide: VEHICULO_REPOSITORY, useClass: TypeOrmAmbulanciaRepository },
    { provide: ESTACION_SERVICIO_REPOSITORY, useClass: TypeOrmEstacionServicioRepository },
    { provide: TANQUEO_REPOSITORY, useClass: TypeOrmTanqueoRepository },
    {
      provide: TANQUEO_INCONSISTENCIA_REPOSITORY,
      useClass: TypeOrmTanqueoInconsistenciaRepository,
    },
    { provide: SYNC_LOG_REPOSITORY, useClass: TypeOrmSyncLogRepository },
    { provide: ABASTECIMIENTO_REPOSITORY, useClass: TypeOrmAbastecimientoRepository },
    {
      provide: REPOSITORIO_COMBUSTIBLE_REPOSITORY,
      useClass: TypeOrmRepositorioCombustibleRepository,
    },
    { provide: LECTURA_ODOMETRO_REPOSITORY, useClass: TypeOrmLecturaOdometroRepository },
    { provide: TANQUEO_CORRECCION_REPOSITORY, useClass: TypeOrmTanqueoCorreccionRepository },
    { provide: TANQUEO_INTENTO_REPOSITORY, useClass: TypeOrmTanqueoIntentoRepository },
    { provide: TANQUEO_EVIDENCIA_LOG_REPOSITORY, useClass: TypeOrmTanqueoEvidenciaLogRepository },
    { provide: TANQUEO_EVENTO_LOG_REPOSITORY, useClass: TypeOrmTanqueoEventoLogRepository },
    { provide: TRANSACTION_MANAGER, useClass: TypeOrmTransactionManagerImpl },
  ],
  exports: [TANQUEO_REPOSITORY, VehiculosService, EstacionesServicioService, TanqueoService],
})
export class VehiculosModule {}

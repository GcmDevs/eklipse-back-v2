import { AuthModule } from '@auth/auth.module';
import { TRANSACTION_MANAGER } from '@common/application/services';
import { TypeOrmTransactionManagerImpl } from '@common/infrastructure/persistence/transactional';
import { IdentityModule } from '@inn/core/identity/identity.module';
import { VehiculosModule } from '@inn/operaciones/tanqueos/vehiculos.module';
import {
  AMBULANCIA_FLOTA_REPOSITORY,
  DOTACION_FLOTA_REPOSITORY,
  DOTACION_NOVEDAD_REPOSITORY,
  ELEMENTO_VENC_FLOTA_REPOSITORY,
  ENTREGA_DECL_FLOTA_REPOSITORY,
  ENTREGA_FLOTA_REPOSITORY,
  EVENTO_FLOTA_REPOSITORY,
  LIMPIEZA_FLOTA_REPOSITORY,
  PLANTILLA_FLOTA_REPOSITORY,
  TURNO_FLOTA_REPOSITORY,
  VENCIMIENTO_FLOTA_QUERY,
} from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import {
  TypeOrmAmbulanciaFlotaRepository,
  TypeOrmDotacionFlotaRepository,
  TypeOrmDotacionNovedadRepository,
  TypeOrmElementoVencFlotaRepository,
  TypeOrmEntregaDeclFlotaRepository,
  TypeOrmEntregaFlotaRepository,
  TypeOrmEventoFlotaRepository,
  TypeOrmLimpiezaFlotaRepository,
  TypeOrmPlantillaFlotaRepository,
  TypeOrmTurnoFlotaRepository,
  TypeOrmVencimientoFlotaQuery,
} from '@inn/operaciones/turnos-vehiculos/infrastructure';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AmbulanciaFlotaService, EntregaService, FLOTA_PROVIDERS, TurnoService } from './application';
import { FLOTA_CONTROLLERS } from './presentation';

@Module({
  imports: [AuthModule, VehiculosModule, IdentityModule, ScheduleModule.forRoot()],
  controllers: [...FLOTA_CONTROLLERS],
  providers: [
    ...FLOTA_PROVIDERS,
    { provide: AMBULANCIA_FLOTA_REPOSITORY, useClass: TypeOrmAmbulanciaFlotaRepository },
    { provide: PLANTILLA_FLOTA_REPOSITORY, useClass: TypeOrmPlantillaFlotaRepository },
    { provide: TURNO_FLOTA_REPOSITORY, useClass: TypeOrmTurnoFlotaRepository },
    { provide: ENTREGA_FLOTA_REPOSITORY, useClass: TypeOrmEntregaFlotaRepository },
    { provide: ENTREGA_DECL_FLOTA_REPOSITORY, useClass: TypeOrmEntregaDeclFlotaRepository },
    { provide: LIMPIEZA_FLOTA_REPOSITORY, useClass: TypeOrmLimpiezaFlotaRepository },
    { provide: DOTACION_FLOTA_REPOSITORY, useClass: TypeOrmDotacionFlotaRepository },
    { provide: DOTACION_NOVEDAD_REPOSITORY, useClass: TypeOrmDotacionNovedadRepository },
    { provide: ELEMENTO_VENC_FLOTA_REPOSITORY, useClass: TypeOrmElementoVencFlotaRepository },
    { provide: EVENTO_FLOTA_REPOSITORY, useClass: TypeOrmEventoFlotaRepository },
    { provide: VENCIMIENTO_FLOTA_QUERY, useClass: TypeOrmVencimientoFlotaQuery },
    { provide: TRANSACTION_MANAGER, useClass: TypeOrmTransactionManagerImpl },
  ],
  exports: [AmbulanciaFlotaService, TurnoService, EntregaService],
})
export class FlotaModule {}

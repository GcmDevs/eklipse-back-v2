import { DOMAIN_EVENT_DISPATCHER, TRANSACTION_MANAGER } from '@common/application/services';
import { TypeOrmTransactionManagerImpl } from '@common/infrastructure/persistence/transactional';
import { AuthModule } from '@auth/auth.module';
import { FirmaModule } from '@core/firmas/firma.module';
import { TercerosModule } from '@core/terceros/tercero.module';
import {
  ACCESORIO_TIPO_EQUIPO_REPOSITORY,
  ACCESORIO_UNIDAD_REPOSITORY,
  ASIGNACION_RECURSO_ACTIVIDAD_REPOSITORY,
  AUDIT_TIPO_EQUIPO_REPOSITORY,
  CLASE_EQUIPO_REPOSITORY,
  COMPRA_REPOSITORY,
  CRONOGRAMA_REPOSITORY,
  DOCUMENTO_TIPO_EQUIPO_REPOSITORY,
  EJECUCION_EXTERNA_REPOSITORY,
  EQUIPOS_REPOSITORY,
  EVENTO_AUDIT_EQUIPO_REPOSITORY,
  FORMATO_REPOSITORY,
  MARCA_REPOSITORY,
  MODELO_REPOSITORY,
  PARTES_REPOSITORY,
  PLAN_DEFAULT_TIPO_EQUIPO_REPOSITORY,
  RECURSO_REPOSITORY,
  REGISTRO_ACTIVIDAD_REPOSITORY,
  SOLICITUD_APROBACION_REPOSITORY,
  SUBCLASE_EQUIPO_REPOSITORY,
  TIPO_ACTIVO_REPOSITORY,
  TIPO_DOC_CATEGORIA_ACTIVO_REPOSITORY,
  TIPO_EQUIPO_REPOSITORY,
  UNIDAD_MEDIDA_REPOSITORY,
} from '@equipos/domain/repositories';
import { Module } from '@nestjs/common';
import {
  ActividadesService,
  EQUIPOS_PROVIDERS,
  EquiposService,
  FormatoService,
} from './application';
import {
  TypeOrmAccesorioTipoEquipoRepository,
  TypeOrmAccesorioUnidadRepository,
  TypeOrmAreaRepository,
  TypeOrmAuditTipoEquipoRepository,
  TypeOrmAsignacionRecursoActividadRepository,
  TypeOrmClaseEquipoRepository,
  TypeOrmCompraRepository,
  TypeOrmCronogramaRepository,
  TypeOrmDocumentoTipoEquipoRepository,
  TypeOrmEjecucionExternaRepository,
  TypeOrmEquiposRepository,
  TypeOrmEventoEquipoRepository,
  TypeOrmFormatoRepository,
  TypeOrmMarcaRepository,
  TypeOrmModeloRepository,
  TypeOrmPartesCatgEquipoRepository,
  TypeOrmPlanDefaultTipoEquipoRepository,
  TypeOrmRecursoRepository,
  TypeOrmRegistroActividadRepository,
  TypeOrmSolicitudAprobacionRepository,
  TypeOrmSubclaseEquipoRepository,
  TypeOrmTipoActivoRepository,
  TypeOrmTipoDocCategoriaActivoRepository,
  TypeOrmTipoEquipoRepository,
  TypeOrmUnidadMedidaRepository,
} from './infrastructure';
import { EQUIPOS_CONTROLLERS } from './presentation/controllers';
import { DomainEquipoEventDispatcher } from './application/events';
import { ActividadesDataScopePolicy } from './application/policies/actividades-data-scope.policy';
import { RecursosDataScopePolicy } from './application/policies/recursos-data-scope.policy';

@Module({
  controllers: EQUIPOS_CONTROLLERS,
  providers: [
    ...EQUIPOS_PROVIDERS,
    TypeOrmAreaRepository,
    ActividadesDataScopePolicy,
    RecursosDataScopePolicy,

    { provide: UNIDAD_MEDIDA_REPOSITORY, useClass: TypeOrmUnidadMedidaRepository },
    { provide: MARCA_REPOSITORY, useClass: TypeOrmMarcaRepository },
    { provide: FORMATO_REPOSITORY, useClass: TypeOrmFormatoRepository },
    { provide: MODELO_REPOSITORY, useClass: TypeOrmModeloRepository },
    { provide: EQUIPOS_REPOSITORY, useClass: TypeOrmEquiposRepository },
    { provide: PARTES_REPOSITORY, useClass: TypeOrmPartesCatgEquipoRepository },
    { provide: REGISTRO_ACTIVIDAD_REPOSITORY, useClass: TypeOrmRegistroActividadRepository },
    { provide: EVENTO_AUDIT_EQUIPO_REPOSITORY, useClass: TypeOrmEventoEquipoRepository },
    { provide: SOLICITUD_APROBACION_REPOSITORY, useClass: TypeOrmSolicitudAprobacionRepository },
    { provide: RECURSO_REPOSITORY, useClass: TypeOrmRecursoRepository },
    { provide: EJECUCION_EXTERNA_REPOSITORY, useClass: TypeOrmEjecucionExternaRepository },
    { provide: CRONOGRAMA_REPOSITORY, useClass: TypeOrmCronogramaRepository },
    { provide: ASIGNACION_RECURSO_ACTIVIDAD_REPOSITORY, useClass: TypeOrmAsignacionRecursoActividadRepository },
    { provide: TIPO_ACTIVO_REPOSITORY, useClass: TypeOrmTipoActivoRepository },
    { provide: CLASE_EQUIPO_REPOSITORY, useClass: TypeOrmClaseEquipoRepository },
    { provide: SUBCLASE_EQUIPO_REPOSITORY, useClass: TypeOrmSubclaseEquipoRepository },
    { provide: TIPO_EQUIPO_REPOSITORY, useClass: TypeOrmTipoEquipoRepository },
    { provide: TIPO_DOC_CATEGORIA_ACTIVO_REPOSITORY, useClass: TypeOrmTipoDocCategoriaActivoRepository },
    { provide: ACCESORIO_TIPO_EQUIPO_REPOSITORY, useClass: TypeOrmAccesorioTipoEquipoRepository },
    { provide: AUDIT_TIPO_EQUIPO_REPOSITORY, useClass: TypeOrmAuditTipoEquipoRepository },
    { provide: PLAN_DEFAULT_TIPO_EQUIPO_REPOSITORY, useClass: TypeOrmPlanDefaultTipoEquipoRepository },
    { provide: DOCUMENTO_TIPO_EQUIPO_REPOSITORY, useClass: TypeOrmDocumentoTipoEquipoRepository },
    { provide: COMPRA_REPOSITORY, useClass: TypeOrmCompraRepository },
    { provide: ACCESORIO_UNIDAD_REPOSITORY, useClass: TypeOrmAccesorioUnidadRepository },

    { provide: TRANSACTION_MANAGER, useClass: TypeOrmTransactionManagerImpl },
    { provide: DOMAIN_EVENT_DISPATCHER, useExisting: DomainEquipoEventDispatcher },
  ],
  exports: [FORMATO_REPOSITORY, FormatoService, ActividadesService, EquiposService],
  imports: [AuthModule, TercerosModule, FirmaModule],
})
export class EquiposModule {}

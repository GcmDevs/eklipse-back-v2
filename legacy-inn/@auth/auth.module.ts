import { Global, Module } from '@nestjs/common';
import { DataScopeService } from './application/services/data-scope.service';
import { PermisoCacheService } from './application/services/permiso-cache.service';
import { PermisoResolverService } from './application/services/permiso-resolver.service';
import { PermisosGuard } from './presentation/guards/permisos.guard';

@Global()
@Module({
  providers: [PermisoResolverService, PermisoCacheService, DataScopeService, PermisosGuard],
  exports: [PermisoResolverService, PermisoCacheService, DataScopeService, PermisosGuard],
})
export class AuthModule {}

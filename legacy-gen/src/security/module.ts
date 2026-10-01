import { Module } from '@nestjs/common';
import {
  AuthoritiesController,
  SubModulesController,
  ResourcesController,
  ModulesController,
  AuthController,
} from './presentation/controllers';
import {
  AuthoritiesServicesImpl,
  AuthoritiesCrudImpl,
  SubModulesCrudImpl,
  LoginTerceroImpl,
  ModulesCrudImpl,
  LoginUserImpl,
  ResourcesImpl,
} from './infrastructure/services';

@Module({
  controllers: [
    AuthController,
    ResourcesController,
    ModulesController,
    SubModulesController,
    AuthoritiesController,
  ],
  providers: [
    AuthoritiesServicesImpl,
    AuthoritiesCrudImpl,
    SubModulesCrudImpl,
    LoginTerceroImpl,
    ModulesCrudImpl,
    ResourcesImpl,
    LoginUserImpl,
  ],
})
export class SecurityModule {}

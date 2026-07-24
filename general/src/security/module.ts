import { Module } from '@nestjs/common';
import {
  AuthoritiesController,
  AuthTokReqController,
  SubModulesController,
  ResourcesController,
  ModulesController,
  AuthController,
} from './presentation/controllers';
import {
  AuthoritiesServicesImpl,
  AuthoritiesCrudImpl,
  UpdatePasswordImpl,
  SubModulesCrudImpl,
  ModulesCrudImpl,
  LoginUserImpl,
  ResourcesImpl,
} from './infrastructure/services';

@Module({
  controllers: [
    AuthController,
    AuthTokReqController,
    ResourcesController,
    ModulesController,
    SubModulesController,
    AuthoritiesController,
  ],
  providers: [
    AuthoritiesServicesImpl,
    AuthoritiesCrudImpl,
    SubModulesCrudImpl,
    ModulesCrudImpl,
    UpdatePasswordImpl,
    ResourcesImpl,
    LoginUserImpl,
  ],
})
export class SecurityModule {}

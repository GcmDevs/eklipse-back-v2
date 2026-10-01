import { AuthorityOrm } from './authority.orm';
import { ModuleOrm } from './module.orm';
import { RoleOrm } from './role.orm';
import { SubModuleOrm } from './sub-module.orm';
import { UserOrm } from './user.orm';

export const ORM_COMMON_ENTITIES = [UserOrm, RoleOrm, ModuleOrm, SubModuleOrm, AuthorityOrm];

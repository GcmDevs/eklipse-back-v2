import { _PrivSecAuthOrm } from './authority.orm';
import { _PrivSecModuleOrm } from './module.orm';
import { _PrivSecRoleOrm } from './role.orm';
import { _PrivSecSubModuleOrm } from './sub-module.orm';
import { _PrivSecUserOrm } from './user.orm';
import { _PrivSecEkUserOrm } from './ek-user.orm';
import { _PrivSecUserDependenceOrm } from './user-dependence.orm';
import { _PrivSecDependenceOrm } from './dependence.orm';

export const _PRIV_ORM_AUTH_SEC_ENTITIES = [
  _PrivSecEkUserOrm,
  _PrivSecAuthOrm,
  _PrivSecModuleOrm,
  _PrivSecRoleOrm,
  _PrivSecSubModuleOrm,
  _PrivSecUserOrm,
  _PrivSecUserDependenceOrm,
  _PrivSecDependenceOrm,
];

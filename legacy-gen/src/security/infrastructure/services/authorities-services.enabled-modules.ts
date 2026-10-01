import { GEN_AUTHORITIES } from '@authorities/general';
import { ADMIN_AUTHORITY } from '@authorities/principal';

function enabledModules_GENERAL(authorities: string[]) {
  let response: string[] = [];
  if (authorities.includes(GEN_AUTHORITIES.CODE)) response.push('general', 'seguridad');
  if (authorities.includes(GEN_AUTHORITIES.AUTHORITIES.CODE)) response.push('seguridad-permisos');
  if (authorities.includes(GEN_AUTHORITIES.AUTHORITIES.CREATE_AUTHORITIES))
    response.push('seguridad-permisos-create');
  if (authorities.includes(GEN_AUTHORITIES.AUTHORITIES.MANAGE_ALL_AUTHORITIES))
    response.push('seguridad-permisos-manage-by-usuario');
  if (authorities.includes(GEN_AUTHORITIES.AUTHORITIES.MANAGE_ALL_AUTHORITIES))
    response.push('seguridad-permisos-manage-by-rol');
  return response;
}

export function enabledModules(authorities: string[]) {
  let response: string[] = [];
  if (authorities.includes(ADMIN_AUTHORITY)) response.push('admin');
  response.push(...enabledModules_GENERAL(authorities));
  return response;
}

import { GEN_AUTHORITIES } from "../../../general/authorities";

export function enabledModules_GENERAL(authorities: string[]) {
  let response: string[] = [];
  if (authorities.includes(GEN_AUTHORITIES.CODE)) response.push('general', 'seg');
  if (authorities.includes(GEN_AUTHORITIES.AUTHORITIES.CODE)) response.push('seg-permisos');
  if (authorities.includes(GEN_AUTHORITIES.AUTHORITIES.CREATE_AUTHORITIES)) response.push('seg-permisos-create');
  if (authorities.includes(GEN_AUTHORITIES.AUTHORITIES.MANAGE_ALL_AUTHORITIES)) response.push('seg-permisos-manage-by-usuario','seg-permisos-manage-by-rol');
  return response;
}
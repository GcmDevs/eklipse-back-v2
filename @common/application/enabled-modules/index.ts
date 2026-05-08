import { ADMIN_AUTHORITY } from '../constants';
import { enabledModules_GENERAL } from './general';
import { enabledModules_HOSPITALIZACION } from './hospitalizacion';
import { enabledModules_INVENTARIO } from './inventario';


export function enabledModules(authorities: string[]) {
  let response: string[] = [];
  if (authorities.includes(ADMIN_AUTHORITY)) response.push('admin');
  response.push(...enabledModules_GENERAL(authorities));
  response.push(...enabledModules_HOSPITALIZACION(authorities));
  response.push(...enabledModules_INVENTARIO(authorities));
  return response;
}

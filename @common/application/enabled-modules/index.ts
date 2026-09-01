import { ADMIN_AUTHORITY } from '../constants';
import { enabledModules_GENERAL } from './general';


export function enabledModules(authorities: string[]) {
  let response: string[] = [];
  if (authorities.includes(ADMIN_AUTHORITY)) response.push('admin');
  response.push(...enabledModules_GENERAL(authorities));
  return response;
}

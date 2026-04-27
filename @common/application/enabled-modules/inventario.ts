import { INN_AUTHORITIES } from "../../../inventario/authorities";

export function enabledModules_INVENTARIO(authorities: string[]) {
  let response: string[] = [];
  if (authorities.includes(INN_AUTHORITIES.CODE)) response.push('inn');
  if (authorities.includes(INN_AUTHORITIES.SUMINISTROS_PACIENTE.CODE)) response.push('inn-sumpac');
  if (authorities.includes(INN_AUTHORITIES.SUMINISTROS_PACIENTE.GESTIONAR)) response.push('inn-sumpac-modificar-recibidos','inn-sumpac-pendientes-by-subgrupo','inn-sumpac-pendientes-by-usuario');
  return response;
}
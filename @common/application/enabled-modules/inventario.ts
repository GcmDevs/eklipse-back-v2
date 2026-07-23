import { INN_AUTHORITIES } from "../../../inventario/authorities";

export function enabledModules_INVENTARIO(authorities: string[]) {
  let response: string[] = [];
  if (authorities.includes(INN_AUTHORITIES.CODE)) response.push('inn');
  // SUMINISTROS_PACIENTE
  if (authorities.includes(INN_AUTHORITIES.SUMINISTROS_PACIENTE.CODE)) response.push('inn-sumpac');
  if (authorities.includes(INN_AUTHORITIES.SUMINISTROS_PACIENTE.GESTIONAR)) response.push('inn-sumpac-modificar-recibidos','inn-sumpac-pendientes-by-subgrupo','inn-sumpac-pendientes-by-usuario');
  // FARMACIA
  if (authorities.includes(INN_AUTHORITIES.FARMACIA.CODE)) response.push('inn-farmacia');
  if (authorities.includes(INN_AUTHORITIES.FARMACIA.REPORTE_INVENTARIO)) response.push('inn-farmacia-reporte-inventario');
  return response;
}
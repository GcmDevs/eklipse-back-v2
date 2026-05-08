import { HPN_AUTHORITIES } from "../../../hospitalizacion/authorities";

export function enabledModules_HOSPITALIZACION(authorities: string[]) {
  let response: string[] = [];
  if (authorities.includes(HPN_AUTHORITIES.CODE)) response.push('hpn');
  if (authorities.includes(HPN_AUTHORITIES.PACIENTES.CODE)) response.push('hpn-pacientes');
  if (authorities.includes(HPN_AUTHORITIES.PACIENTES.ENCUESTA_PACIENTE_TRAZADOR)) response.push('hpn-pacientes-manage-trazador');
  return response;
}
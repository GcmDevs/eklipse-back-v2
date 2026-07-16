import { HPN_AUTHORITIES } from "../../../hospitalizacion/authorities";

export function enabledModules_HOSPITALIZACION(authorities: string[]) {
  let response: string[] = [];
  if (authorities.includes(HPN_AUTHORITIES.CODE)) response.push('hpn');
  if (authorities.includes(HPN_AUTHORITIES.PACIENTES.CODE)) response.push('hpn-pacientes');
  if (authorities.includes(HPN_AUTHORITIES.PACIENTES.ENCUESTA_PACIENTE_TRAZADOR)) response.push('hpn-pacientes-manage-trazador');
  if (authorities.includes(HPN_AUTHORITIES.ROTULO_MEDICAMENTOS.CODE)) response.push('hpn-rotulo-medicamento');
  if (authorities.includes(HPN_AUTHORITIES.ROTULO_MEDICAMENTOS.GESTIONAR)) response.push('hpn-rotulo-medicamento-manage');
  if (authorities.includes(HPN_AUTHORITIES.AUDITORIA.CODE)) response.push('hpn-auditoria');
  if (authorities.includes(HPN_AUTHORITIES.AUDITORIA.ESTANCIAS_PROLONGADAS)) response.push('hpn-auditoria-estancias-prolongadas');
  return response;
}
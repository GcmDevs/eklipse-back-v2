import { HPN_AUTHORITIES } from "../../../hospitalizacion/authorities";

export function enabledModules_HOSPITALIZACION(authorities: string[]) {
  let response: string[] = [];
  // PACIENTES
  if (authorities.includes(HPN_AUTHORITIES.CODE)) response.push('hpn');
  if (authorities.includes(HPN_AUTHORITIES.PACIENTES.CODE)) response.push('hpn-pacientes');
  if (authorities.includes(HPN_AUTHORITIES.PACIENTES.ENCUESTA_PACIENTE_TRAZADOR)) response.push('hpn-pacientes-manage-trazador');
  // ROTULO MEDICAMENTOS
  if (authorities.includes(HPN_AUTHORITIES.ROTULO_MEDICAMENTOS.CODE)) response.push('hpn-rotulo-medicamento');
  if (authorities.includes(HPN_AUTHORITIES.ROTULO_MEDICAMENTOS.GESTIONAR)) response.push('hpn-rotulo-medicamento-manage');
  // AUDITORIA
  if (authorities.includes(HPN_AUTHORITIES.AUDITORIA.CODE)) response.push('hpn-auditoria');
  if (authorities.includes(HPN_AUTHORITIES.AUDITORIA.ESTANCIAS_PROLONGADAS)) response.push('hpn-auditoria-estancias-prolongadas');
  // ANATOMOPATOLOGICOS
  if (authorities.includes(HPN_AUTHORITIES.ANATOMOPATOLOGICOS.CODE)) response.push('hpn-anatopato');
  if (authorities.includes(HPN_AUTHORITIES.ANATOMOPATOLOGICOS.GESTIONAR)) response.push('hpn-anatopato-manage');
  if (authorities.includes(HPN_AUTHORITIES.ANATOMOPATOLOGICOS.EDITAR)) response.push('hpn-anatopato-update');
  return response;
}
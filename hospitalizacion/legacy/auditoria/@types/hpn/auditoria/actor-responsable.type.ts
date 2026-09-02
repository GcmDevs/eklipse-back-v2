import { CtmType } from '@common/domain/types';

export type ActorResponsableCode = 1 | 2 | 3 | 4 | 5;

export class ActorResponsableType extends CtmType<ActorResponsableCode> {}

const ATRIBUIDA_USUARIO = new ActorResponsableType(1, 'ATRIBUIDA AL USUARIO');
const ATRIBUIDA_ASEGURADOR = new ActorResponsableType(2, 'ATRIBUIDAS AL ASEGURADOR');
const ATRIBUIDA_PRESTADOR = new ActorResponsableType(3, 'ATRIBUIDAS AL PRESTADOR');
const ATRIBUIDA_CONDICION_CLINICA = new ActorResponsableType(4, 'ATRIBUIDA A LA CONDICIÓN CLINICA');
const ESTANCIA_NO_PROLONGADA = new ActorResponsableType(5, 'ESTANCIA NO PROLONGADA');

export function actorResponsableTypeFactory(code: ActorResponsableCode): ActorResponsableType {
  switch (code) {
    case 1:
      return ATRIBUIDA_USUARIO;
    case 2:
      return ATRIBUIDA_ASEGURADOR;
    case 3:
      return ATRIBUIDA_PRESTADOR;
    case 4:
      return ATRIBUIDA_CONDICION_CLINICA;
    case 5:
      return ESTANCIA_NO_PROLONGADA;
    default:
      throw new Error('No existe tipo de ingreso con este codigo');
  }
}

export const ACTOR_RESPONSABLE_VALUES = [
  ATRIBUIDA_USUARIO,
  ATRIBUIDA_ASEGURADOR,
  ATRIBUIDA_PRESTADOR,
  ATRIBUIDA_CONDICION_CLINICA,
  ESTANCIA_NO_PROLONGADA,
];

export const ACTOR_RESPONSABLE = {
  ATRIBUIDA_USUARIO,
  ATRIBUIDA_ASEGURADOR,
  ATRIBUIDA_PRESTADOR,
  ATRIBUIDA_CONDICION_CLINICA,
  ESTANCIA_NO_PROLONGADA,
};

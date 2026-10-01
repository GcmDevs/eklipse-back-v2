export enum EstadosCama {
  NINGUNO = 0,
  DESOCUPADA = 1,
  OCUPADA = 2,
  BLOQUEADA = 3,
  DESBLOQUEADA = 4,
  ALISTAMIENTO = 5,
  INACTIVA = 6,
  RESERVADA = 7,
}

export const estadosCamasForHumans = (estado: EstadosCama) => {
  switch (estado) {
    case EstadosCama.NINGUNO:
      return 'NINGUNO';
    case EstadosCama.DESOCUPADA:
      return 'DESOCUPADA';
    case EstadosCama.OCUPADA:
      return 'OCUPADA';
    case EstadosCama.BLOQUEADA:
      return 'BLOQUEADA';
    case EstadosCama.DESBLOQUEADA:
      return 'DESBLOQUEADA';
    case EstadosCama.ALISTAMIENTO:
      return 'ALISTAMIENTO';
    case EstadosCama.RESERVADA:
      return 'RESERVADA';
    case EstadosCama.INACTIVA:
      return 'INACTIVA';
  }
};

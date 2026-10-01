export enum EstadoOrderServicio {
  NINGUNO = 0,
  REGISTRADO = 1,
  CONFIRMADO = 2,
  ANULADO = 3,
}

export const estadoOrdenServicioForHumans = (estado: EstadoOrderServicio) => {
  switch (estado) {
    case EstadoOrderServicio.NINGUNO:
      return 'NINGUNO';
    case EstadoOrderServicio.REGISTRADO:
      return 'REGISTRADO';
    case EstadoOrderServicio.CONFIRMADO:
      return 'CONFIRMADO';
    case EstadoOrderServicio.ANULADO:
      return 'ANULADO';
  }
};

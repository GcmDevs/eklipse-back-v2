export enum ClaseIngreso {
  NINGUNO = 0,
  AMBULATORIO = 1,
  HOSPITALARIO = 2,
}

export const claseIngresoForHumans = (estado: ClaseIngreso) => {
  switch (estado) {
    case ClaseIngreso.NINGUNO:
      return 'NINGUNO';
    case ClaseIngreso.AMBULATORIO:
      return 'AMBULATORIO';
    case ClaseIngreso.HOSPITALARIO:
      return 'HOSPITALARIO';
  }
};

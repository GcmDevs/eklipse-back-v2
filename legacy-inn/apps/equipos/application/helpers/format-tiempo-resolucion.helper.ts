export function formatTiempoResolucion(
  createdAt: Date,
  fechaResolucion?: Date | null
): string | null {
  if (!fechaResolucion) return null;

  let diffMs = fechaResolucion.getTime() - createdAt.getTime();

  const seconds = Math.floor(diffMs / 1000);
  const minutesTotal = Math.floor(seconds / 60);
  const hoursTotal = Math.floor(minutesTotal / 60);
  const days = Math.floor(hoursTotal / 24);

  if (seconds < 60) {
    return `${seconds} segundos`;
  }

  if (minutesTotal < 60) {
    return `${minutesTotal} minutos`;
  }

  const remainingHours = hoursTotal % 24;
  const remainingMinutes = minutesTotal % 60;

  if (days === 0) {
    if (remainingMinutes === 0) {
      return `${hoursTotal} horas`;
    }
    return `${hoursTotal} horas y ${remainingMinutes} minutos`;
  }

  let result = `${days} días`;

  if (remainingHours > 0) {
    result += ` y ${remainingHours} horas`;
  }

  if (remainingMinutes > 0) {
    result += ` y ${remainingMinutes} minutos`;
  }

  return result;
}

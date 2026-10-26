export function fechaNacimientoCalendario(value: string | Date | null | undefined): string {
  if (!value) return '';
  return value instanceof Date
    ? (Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10))
    : value.slice(0, 10);
}

export function esFechaNacimientoValida(value: unknown, hoy = new Date()): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  const mesDia = `${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  const minima = new Date(Date.UTC(hoy.getFullYear() - 150, hoy.getMonth(), hoy.getDate())).toISOString().slice(0, 10);
  return value <= `${hoy.getFullYear()}-${mesDia}` && value >= minima;
}

export function edadDesdeNacimiento(value: string | Date | null | undefined, hoy = new Date()): number {
  const fecha = fechaNacimientoCalendario(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return 0;
  const [year, month, day] = fecha.split('-').map(Number);
  const cumplio = hoy.getMonth() + 1 > month || (hoy.getMonth() + 1 === month && hoy.getDate() >= day);
  return Math.max(0, hoy.getFullYear() - year - (cumplio ? 0 : 1));
}

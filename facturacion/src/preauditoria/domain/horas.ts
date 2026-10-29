import { BadRequestException } from '@nestjs/common';
import { CalculoHoras, Salario, SegmentoHora } from './modelo';
import { decimal, fechaDia, redondear, texto } from './reglas';

// Fuentes: CST art. 168; leyes 2101/2021, 2466/2025, 51/1983 y 2578/2026.
// Guardar esta versión y los parámetros junto con cada cálculo histórico.
export const VERSION_HORAS = 'CO-2026-10-28-v1';
const DIA = 86400000;
export function festivos(anio: number): Map<string, string> {
  const dias = new Map<string, string>();
  const dia = (m: number, d: number) => new Date(Date.UTC(anio, m - 1, d));
  const sumar = (d: Date, n: number) => new Date(d.getTime() + n * DIA);
  const lunes = (d: Date) => sumar(d, (8 - d.getUTCDay()) % 7);
  const agregar = (d: Date, nombre: string) => {
    const clave = d.toISOString().slice(0, 10);
    dias.set(clave, [dias.get(clave), nombre].filter(Boolean).join(' / '));
  };
  for (const [m, d, nombre] of [
    [1, 1, 'Año Nuevo'],
    [5, 1, 'Día del Trabajo'],
    [7, 20, 'Independencia'],
    [8, 7, 'Batalla de Boyacá'],
    [12, 8, 'Inmaculada Concepción'],
    [12, 25, 'Navidad'],
  ] as const)
    agregar(dia(m, d), nombre);
  for (const [m, d, nombre] of [
    [1, 6, 'Reyes Magos'],
    [3, 19, 'San José'],
    [6, 29, 'San Pedro y San Pablo'],
    [8, 15, 'Asunción'],
    [10, 12, 'Diversidad Étnica y Cultural'],
    [11, 1, 'Todos los Santos'],
    [11, 11, 'Independencia de Cartagena'],
  ] as const)
    agregar(lunes(dia(m, d)), nombre);
  if (anio >= 2026) agregar(lunes(dia(7, 9)), 'Nuestra Señora del Rosario de Chiquinquirá');
  const a = anio % 19,
    b = Math.floor(anio / 100),
    c = anio % 100;
  const h =
    (19 * a + b - Math.floor(b / 4) - Math.floor((b - Math.floor((b + 8) / 25) + 1) / 3) + 15) % 30;
  const l = (32 + 2 * (b % 4) + 2 * Math.floor(c / 4) - h - (c % 4)) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451),
    base = h + l - 7 * m + 114;
  const pascua = dia(Math.floor(base / 31), (base % 31) + 1);
  agregar(sumar(pascua, -3), 'Jueves Santo');
  agregar(sumar(pascua, -2), 'Viernes Santo');
  agregar(lunes(sumar(pascua, 39)), 'Ascensión');
  agregar(lunes(sumar(pascua, 60)), 'Corpus Christi');
  agregar(lunes(sumar(pascua, 68)), 'Sagrado Corazón');
  return dias;
}
export function reglasHoras(fecha: string) {
  return {
    divisor: fecha >= '2026-07-15' ? 210 : fecha >= '2025-07-15' ? 220 : 230,
    noche: fecha >= '2025-12-25' ? 19 : 21,
    descanso:
      fecha >= '2027-07-01' ? 1 : fecha >= '2026-07-01' ? 0.9 : fecha >= '2025-07-01' ? 0.8 : 0.75,
  };
}
export function calcularHoras(p: Record<string, unknown>, salarios: Salario[]): CalculoHoras {
  const fecha = fechaDia(p.fecha),
    inicioTexto = texto(p.inicio, 5),
    finTexto = texto(p.fin, 5);
  if (fecha < '2025-01-01' || fecha > '2030-12-31')
    throw new BadRequestException('Esta versión del cálculo admite fechas entre 2025 y 2030.');
  const hora = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!hora.test(inicioTexto) || !hora.test(finTexto))
    throw new BadRequestException('Revisa las horas.');
  const inicio = Date.parse(`${fecha}T${inicioTexto}:00Z`);
  const fin = Date.parse(`${fecha}T${finTexto}:00Z`) + (p.diaSiguiente === true ? DIA : 0);
  if (fin <= inicio || fin - inicio > DIA)
    throw new BadRequestException('El intervalo debe ser mayor de cero y máximo 24 horas.');
  const descanso = Number(p.descanso);
  if (!Number.isInteger(descanso) || descanso < 0 || descanso > 6)
    throw new BadRequestException('Selecciona el día de descanso pactado.');
  const divisorPropio =
    p.divisor == null || p.divisor === '' ? null : decimal(p.divisor, 'divisor', 2, 240);
  if (divisorPropio === 0) throw new BadRequestException('El divisor debe ser mayor de cero.');
  const grupos = new Map<string, SegmentoHora>(),
    calendario = new Map<number, Map<string, string>>();
  const ordenados = [...salarios].sort((a, b) => a.vigencia.localeCompare(b.vigencia));
  for (let minuto = inicio; minuto < fin; minuto += 60000) {
    const d = new Date(minuto),
      dia = d.toISOString().slice(0, 10),
      reglas = reglasHoras(dia);
    const salario = ordenados.filter(s => s.vigencia <= dia).at(-1)?.salario;
    if (!salario || !Number.isFinite(salario))
      throw new BadRequestException(`No hay salario configurado con vigencia para ${dia}.`);
    if (!calendario.has(d.getUTCFullYear()))
      calendario.set(d.getUTCFullYear(), festivos(d.getUTCFullYear()));
    const festivo = calendario.get(d.getUTCFullYear()).get(dia) || '';
    const esDescanso = d.getUTCDay() === descanso,
      nocturna = d.getUTCHours() < 6 || d.getUTCHours() >= reglas.noche;
    const factor = redondear(
      1 +
        (nocturna ? 0.75 : 0.25) +
        (festivo || esDescanso ? (p.recargoCompleto === true ? 1 : reglas.descanso) : 0)
    );
    const divisor = divisorPropio ?? reglas.divisor,
      clave = `${dia}|${nocturna}|${factor}|${divisor}|${salario}`;
    if (!grupos.has(clave))
      grupos.set(clave, {
        fecha: dia,
        minutos: 0,
        nocturna,
        festivo,
        descanso: esDescanso,
        factor,
        divisor,
        salario,
        valor: 0,
      });
    grupos.get(clave).minutos++;
  }
  const segmentos = [...grupos.values()].map(s => ({
    ...s,
    valor: redondear(((s.salario / s.divisor) * s.factor * s.minutos) / 60),
  }));
  return {
    inicio,
    fin,
    minutos: (fin - inicio) / 60000,
    valor: redondear(segmentos.reduce((t, s) => t + s.valor, 0)),
    segmentos,
    regla: VERSION_HORAS,
  };
}

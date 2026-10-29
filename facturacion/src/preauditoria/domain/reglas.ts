import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ADMIN_AUTHORITY } from '@common/application/constants';
import { Actor, Auditoria, Hallazgo, PERMISOS_PRE, PermisoPre } from './modelo';

export function texto(v: unknown, max = 200): string {
  if (v != null && typeof v !== 'string') throw new BadRequestException('Se esperaba un texto.');
  const s = String(v ?? '').trim();
  if (s.length > max) throw new BadRequestException(`El texto supera ${max} caracteres.`);
  return s;
}
export function requerido(v: unknown, campo: string, max = 200): string {
  const s = texto(v, max);
  if (!s) throw new BadRequestException(`Completa ${campo}.`);
  return s;
}
export function puede(a: Actor, p: PermisoPre): boolean {
  return (
    a.permisos.includes(ADMIN_AUTHORITY) ||
    a.permisos.includes('admin') ||
    a.permisos.includes(PERMISOS_PRE[p])
  );
}
export function exigir(a: Actor, ...p: PermisoPre[]): void {
  if (!p.some(x => puede(a, x)))
    throw new ForbiddenException('No tienes permiso para esta acción.');
}
export function consultar(a: Actor, r: Auditoria): void {
  if (
    r.contexto !== a.contexto ||
    (!puede(a, 'equipo') && !(puede(a, 'auditar') && r.responsableId === a.id))
  ) {
    throw new ForbiddenException('No puedes consultar esta auditoría.');
  }
}
export function editar(a: Actor, r: Auditoria): void {
  exigir(a, 'auditar');
  if (r.responsableId !== a.id || !['En auditoría', 'En corrección'].includes(r.estado))
    throw new ForbiddenException('Solo puedes editar tu auditoría iniciada o en corrección.');
}
export function versionEsperada(r: { version: number }, version: unknown): void {
  if (!Number.isInteger(version) || r.version !== version)
    throw new ConflictException(
      'El registro cambió. Actualiza antes de continuar; tus cambios no se sobrescribieron.'
    );
}
export const ahora = (): string => new Date().toISOString();
export const colombia = (): string => new Date(Date.now() - 5 * 3600000).toISOString().slice(0, 19);
export function fechaDia(v: unknown): string {
  const s = texto(v, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(s) ||
    !Number.isFinite(Date.parse(s + 'T00:00Z')) ||
    new Date(s + 'T00:00Z').toISOString().slice(0, 10) !== s
  )
    throw new BadRequestException('La fecha no es válida.');
  return s;
}
export function recepcion(v: unknown): string {
  const s = texto(v, 25);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s))
    throw new BadRequestException('Indica la fecha y hora de recepción en Colombia.');
  fechaDia(s.slice(0, 10));
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(s.slice(11)))
    throw new BadRequestException('La hora de recepción no es válida.');
  const stamp = new Date(s + '-05:00');
  if (stamp.getTime() > Date.now())
    throw new BadRequestException('La recepción no puede estar en el futuro.');
  return stamp.toISOString();
}
export function decimal(v: unknown, campo: string, escala = 2, max = 1e12): number {
  if (
    (typeof v !== 'number' && typeof v !== 'string') ||
    String(v).trim() === '' ||
    !/^\d+(\.\d+)?$/.test(String(v)) ||
    !Number.isFinite(Number(v)) ||
    Number(v) > max ||
    (String(v).split('.')[1]?.length ?? 0) > escala
  )
    throw new BadRequestException(
      `Revisa ${campo}: usa un número positivo con hasta ${escala} decimales.`
    );
  return Number(v);
}
export const redondear = (v: number): number => Math.round((v + Number.EPSILON) * 100) / 100;
export function ingresoValido(v: unknown): string {
  const s = texto(v, 20);
  if (!/^\d{1,20}$/.test(s))
    throw new BadRequestException('El ingreso debe contener de 1 a 20 dígitos.');
  return s;
}
export function identificador(v: unknown): string {
  const s = texto(v, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s))
    throw new BadRequestException('Identificador inválido.');
  return s;
}
export function normalizarHallazgos(
  input: unknown,
  catalogo: { code: string; specific: string; general: string }[]
): Hallazgo[] {
  if (!Array.isArray(input) || input.length > 1000)
    throw new BadRequestException('Máximo 1000 hallazgos.');
  const ids = new Set<string>();
  return input.map(f => {
    if (!f || typeof f !== 'object') throw new BadRequestException('Hallazgo inválido.');
    const causal = catalogo.find(c => c.code === texto(f.codigo, 10).toUpperCase());
    if (!causal) throw new BadRequestException('Selecciona una causal válida del catálogo.');
    if (!['ninguno', 'preglosa', 'porFacturar'].includes(f.destino))
      throw new BadRequestException('Selecciona el destino del valor.');
    const cantidad =
      f.cantidad === null || f.cantidad === '' ? null : decimal(f.cantidad, 'cantidad', 3, 1e6);
    const valorUnitario =
      f.valorUnitario === null || f.valorUnitario === ''
        ? null
        : decimal(f.valorUnitario, 'valor unitario', 2, 1e9);
    if (f.destino !== 'ninguno' && (cantidad == null || valorUnitario == null))
      throw new BadRequestException(
        'Completa cantidad y valor unitario para calcular el hallazgo.'
      );
    const id = f.id ? identificador(f.id) : randomUUID();
    if (ids.has(id)) throw new BadRequestException('Hay hallazgos repetidos.');
    ids.add(id);
    // Céntimos y milésimas evitan acumular errores de coma flotante.
    const importe =
      cantidad == null || valorUnitario == null
        ? null
        : Number(
            (BigInt(Math.round(valorUnitario * 100)) * BigInt(Math.round(cantidad * 1000)) + 500n) /
              1000n
          ) / 100;
    if (importe != null && importe > 1e12)
      throw new BadRequestException('El importe del hallazgo supera el límite.');
    return {
      id,
      codigo: causal.code,
      especifica: causal.specific,
      general: causal.general,
      servicioCodigo: texto(f.servicioCodigo, 30),
      servicio: requerido(f.servicio, 'servicio', 600),
      cantidad,
      valorUnitario,
      motivo: requerido(f.motivo, 'motivo'),
      area: requerido(f.area, 'área'),
      descripcion: requerido(f.descripcion, 'descripción', 3000),
      destino: f.destino,
      preglosa: f.destino === 'preglosa' ? importe : null,
      porFacturar: f.destino === 'porFacturar' ? importe : null,
    };
  });
}

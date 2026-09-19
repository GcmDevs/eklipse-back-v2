import { QueryRunner } from 'typeorm';
import { insertarObservacionQuery } from '../queries/observacion.query';

// Uses the tab's transaction: a failure rolls back both management data and its note.
export async function guardarObservacionPendiente(
  runner: QueryRunner,
  body: { ingreso: number; folio: number; observacionPendiente?: string },
  gestor: 'AUDITORIA' | 'GESTOR' | 'MAOS' | 'PROGRAMACION',
  usuario: string
): Promise<void> {
  const observacion = body.observacionPendiente?.trim();
  if (!observacion) return;
  await runner.query(insertarObservacionQuery(), [
    body.ingreso,
    observacion,
    body.folio,
    gestor,
    usuario,
  ]);
}

import { QueryRunner } from 'typeorm';
import { GcmContextType } from '@common/domain/types';

/** Serializa todos los escritores de dietas, también entre procesos del backend. */
export async function bloquearDietas(
  qr: QueryRunner,
  context: GcmContextType,
  fecha: Date
): Promise<void> {
  const recurso = `dietas:${context.getCode()}:${fecha.toISOString().slice(0, 10)}`;
  const resultado: { resultado: number }[] = await qr.query(
    `DECLARE @resultado int;
     EXEC @resultado = sys.sp_getapplock
       @Resource = @0, @LockMode = 'Exclusive',
       @LockOwner = 'Transaction', @LockTimeout = 15000;
     SELECT @resultado AS resultado;`,
    [recurso]
  );
  if (
    !resultado.length ||
    !Number.isInteger(resultado[0].resultado) ||
    resultado[0].resultado < 0
  ) {
    throw new Error('No fue posible obtener el bloqueo de registro de dietas.');
  }
}

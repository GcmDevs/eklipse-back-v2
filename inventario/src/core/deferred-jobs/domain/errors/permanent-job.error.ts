/**
 * Un handler lanza este error cuando reintentar no tiene sentido (payload inválido,
 * handler inexistente, regla violada de forma irrecuperable). El job falla de inmediato
 * y queda retenido para inspección. Cualquier otro error se considera transitorio y se
 * reintenta con backoff.
 */
export class PermanentJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermanentJobError';
  }
}

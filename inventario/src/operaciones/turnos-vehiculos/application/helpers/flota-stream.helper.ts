import { FlotaSsePayload } from '@inn/operaciones/turnos-vehiculos/domain/read';
import { MessageEvent } from '@nestjs/common';
import { Observable, interval, map, merge, takeUntil, timer } from 'rxjs';

/** Tope de vida de una conexión: fuerza a re-autenticar y re-evaluar permisos. */
export const FLOTA_STREAM_MAX_LIFETIME_MS = 15 * 60 * 1000;
export const FLOTA_STREAM_HEARTBEAT_MS = 25 * 1000;

/**
 * Vida útil de una conexión SSE: lo que reste del token verificado, acotado por el tope.
 * `tokenExpSeconds` es el `exp` ya verificado criptográficamente (nunca el de un token
 * sin verificar).
 */
export const flotaStreamTtlMs = (
  tokenExpSeconds: number,
  now = Date.now(),
  maxMs = FLOTA_STREAM_MAX_LIFETIME_MS,
): number => Math.max(0, Math.min(tokenExpSeconds * 1000 - now, maxMs));

/**
 * Arma el stream SSE de Flota. Los eventos `message` conservan el contrato
 * `{ tipo, entidad, entidadId, vehiculoId }`; además se emite un `ping` periódico (evento
 * con nombre, que los clientes ignoran) para que proxies no corten la conexión inactiva.
 * El stream COMPLETA al cumplirse `ttlMs`: el cliente reconecta y se vuelve a autenticar.
 */
export const buildFlotaStream = (
  events$: Observable<FlotaSsePayload>,
  ttlMs: number,
  heartbeatMs = FLOTA_STREAM_HEARTBEAT_MS,
): Observable<MessageEvent> =>
  merge(
    events$.pipe(map(data => ({ data }) as MessageEvent)),
    interval(heartbeatMs).pipe(map(() => ({ type: 'ping', data: '' }) as MessageEvent)),
  ).pipe(takeUntil(timer(ttlMs)));

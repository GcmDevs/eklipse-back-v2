import { MessageEvent } from '@nestjs/common';
import { Subject } from 'rxjs';
import {
  FLOTA_STREAM_MAX_LIFETIME_MS,
  buildFlotaStream,
  flotaStreamTtlMs,
} from './flota-stream.helper';

describe('flotaStreamTtlMs', () => {
  const now = Date.parse('2026-03-10T08:00:00.000Z');
  const exp = (ms: number) => Math.floor((now + ms) / 1000);

  it('usa lo que resta del token si es menor al tope', () => {
    expect(flotaStreamTtlMs(exp(60_000), now)).toBe(60_000);
  });
  it('acota al tope de vida aunque el token dure días', () => {
    expect(flotaStreamTtlMs(exp(7 * 24 * 3_600_000), now)).toBe(FLOTA_STREAM_MAX_LIFETIME_MS);
  });
  it('un token ya vencido da 0 (el stream se cierra de inmediato)', () => {
    expect(flotaStreamTtlMs(exp(-5_000), now)).toBe(0);
  });
});

describe('buildFlotaStream', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const collect = (source: Subject<any>, ttl: number, heartbeat = 1_000) => {
    const received: MessageEvent[] = [];
    let completed = false;
    buildFlotaStream(source, ttl, heartbeat).subscribe({
      next: e => received.push(e),
      complete: () => (completed = true),
    });
    return { received, isCompleted: () => completed };
  };

  it('conserva el contrato { tipo, entidad, entidadId, vehiculoId } en eventos message', () => {
    const bus = new Subject<any>();
    const { received } = collect(bus, 60_000);
    const payload = { tipo: 'ENTREGA_LANZADA', entidad: 'ENTREGA', entidadId: 7, vehiculoId: 3 };

    bus.next(payload);

    expect(received).toEqual([{ data: payload }]);
    expect(received[0].type).toBeUndefined();
  });

  it('emite ping periódico como evento con nombre, distinto de message', () => {
    const { received } = collect(new Subject<any>(), 60_000, 1_000);
    jest.advanceTimersByTime(3_000);
    expect(received.map(e => e.type)).toEqual(['ping', 'ping', 'ping']);
  });

  it('completa al cumplirse el TTL (el cliente reconecta y se reautentica)', () => {
    const bus = new Subject<any>();
    const { received, isCompleted } = collect(bus, 5_000);

    jest.advanceTimersByTime(4_999);
    expect(isCompleted()).toBe(false);
    jest.advanceTimersByTime(1);
    expect(isCompleted()).toBe(true);

    bus.next({ tipo: 'X', entidad: 'TURNO', entidadId: 1 });
    expect(received.filter(e => e.type === undefined)).toHaveLength(0);
  });

  it('con TTL 0 completa sin entregar eventos', () => {
    const { isCompleted } = collect(new Subject<any>(), 0);
    jest.advanceTimersByTime(0);
    expect(isCompleted()).toBe(true);
  });

  it('al desuscribirse libera la suscripción al bus', () => {
    const bus = new Subject<any>();
    const sub = buildFlotaStream(bus, 60_000, 1_000).subscribe();
    expect(bus.observed).toBe(true);
    sub.unsubscribe();
    expect(bus.observed).toBe(false);
  });
});

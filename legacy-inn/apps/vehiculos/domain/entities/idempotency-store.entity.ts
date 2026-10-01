import { BadInputError } from '@common/domain/errors';
import { Id, normalizeUppercaseText } from '@common/domain/value-objects';

export class IdempotencyStore {
  private constructor(
    private readonly id: Id,
    private idempotencyKey: string,
    private tanqueoId: Id | null,
    private resultado: string | null,
    private statusCode: number | null,
    private procesada: boolean,
    private expiresAt: Date,
    private readonly createdAt: Date
  ) {}

  static create(idempotencyKey: string, ttlMinutes: number = 60): IdempotencyStore {
    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      throw new BadInputError('La clave de idempotencia es requerida');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    return new IdempotencyStore(
      new Id(),
      normalizeUppercaseText(idempotencyKey),
      null,
      null,
      null,
      false,
      expiresAt,
      now
    );
  }

  static rebuild(
    id: number,
    idempotencyKey: string,
    tanqueoId: number | null,
    resultado: string | null,
    statusCode: number | null,
    procesada: boolean,
    expiresAt: Date,
    createdAt: Date
  ): IdempotencyStore {
    return new IdempotencyStore(
      new Id(id),
      idempotencyKey,
      tanqueoId ? new Id(tanqueoId) : null,
      resultado,
      statusCode,
      procesada,
      expiresAt,
      createdAt
    );
  }

  markProcesada(tanqueoId: number, resultado: string, statusCode: number): void {
    if (this.procesada) {
      throw new BadInputError('La solicitud ya fue procesada');
    }
    this.tanqueoId = new Id(tanqueoId);
    this.resultado = normalizeUppercaseText(resultado);
    this.statusCode = statusCode;
    this.procesada = true;
  }

  isExpirada(): boolean {
    return new Date() > this.expiresAt;
  }

  isProcesada(): boolean {
    return this.procesada;
  }

  isValida(): boolean {
    return !this.isExpirada() && this.procesada;
  }

  get getId(): Id {
    return this.id;
  }

  get getIdempotencyKey(): string {
    return this.idempotencyKey;
  }

  get getTanqueoId(): Id | null {
    return this.tanqueoId;
  }

  get getResultado(): string | null {
    return this.resultado;
  }

  get getStatusCode(): number | null {
    return this.statusCode;
  }

  get getProcesada(): boolean {
    return this.procesada;
  }

  get getExpiresAt(): Date {
    return this.expiresAt;
  }

  get getCreatedAt(): Date {
    return this.createdAt;
  }
}

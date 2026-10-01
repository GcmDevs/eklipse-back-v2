import { RequestContext } from '@common/infrastructure/services';

export abstract class DomainEventBase {
    abstract readonly descripcion: string;
    abstract readonly metadata: Record<string, any>;

    readonly occurredAt: Date = new Date();
    readonly autorId: number | null;
    readonly autorNombre: string;
    correlationId: string | null = null;

    constructor() {
        const ctx = RequestContext.tryGet();
        this.autorId = ctx?.usuario?.id ?? null;
        this.autorNombre = ctx?.usuario?.nombre ?? 'sistema';
    }
}
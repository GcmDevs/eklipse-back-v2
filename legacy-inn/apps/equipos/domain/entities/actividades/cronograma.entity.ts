import { BadInputError } from "@common/domain/errors";
import { Id } from "@common/domain/value-objects";
import { EstadoCronograma, TipoActividad } from "@equipos/domain/enums";

export class Cronograma {
    private constructor(
        private readonly id: Id,
        private readonly anio: number,
        private readonly mes: number,
        private readonly tipo: TipoActividad,
        private estado: EstadoCronograma,
        private metaCumplimientoPct: number,
        private readonly creadoPorId: number,
        private notas: string | null,
        private readonly createdAt: Date,
        private updatedAt: Date,
    ) { }

    static create(data: {
        anio: number;
        mes: number;
        tipo: TipoActividad;
        creadoPorId: number;
        metaCumplimientoPct?: number;
        notas?: string | null;
    }): Cronograma {
        Cronograma.validatePeriodo(data.anio, data.mes);
        const meta = data.metaCumplimientoPct ?? 90;
        Cronograma.validateMeta(meta);
        return new Cronograma(
            new Id(),
            data.anio,
            data.mes,
            data.tipo,
            EstadoCronograma.ACTIVO,
            meta,
            data.creadoPorId,
            data.notas ?? null,
            new Date(),
            new Date(),
        );
    }

    static rebuild(
        id: number,
        anio: number,
        mes: number,
        tipo: TipoActividad,
        estado: EstadoCronograma,
        metaCumplimientoPct: number,
        creadoPorId: number,
        notas: string | null,
        createdAt: Date,
        updatedAt: Date,
    ): Cronograma {
        return new Cronograma(
            new Id(id),
            anio,
            mes,
            tipo,
            estado,
            metaCumplimientoPct,
            creadoPorId,
            notas,
            createdAt,
            updatedAt,
        );
    }


    close(): void {
        this.ensureActivo();
        this.estado = EstadoCronograma.CERRADO;
        this.updatedAt = new Date();
    }

    annul(): void {
        if (this.estado === EstadoCronograma.CERRADO)
            throw new BadInputError('No se puede anular un cronograma ya cerrado');
        this.estado = EstadoCronograma.ANULADO;
        this.updatedAt = new Date();
    }

    updateMeta(nuevaMeta: number): void {
        this.ensureActivo();
        Cronograma.validateMeta(nuevaMeta);
        this.metaCumplimientoPct = nuevaMeta;
        this.updatedAt = new Date();
    }

    updateNotas(notas: string | null): void {
        this.notas = notas;
        this.updatedAt = new Date();
    }

    private ensureActivo(): void {
        if (this.estado !== EstadoCronograma.ACTIVO)
            throw new BadInputError(
                `No se puede modificar un cronograma en estado ${this.estado}`,
            );
    }

    private static validatePeriodo(anio: number, mes: number): void {
        if (anio < 2000 || anio > 2100)
            throw new BadInputError('El año debe estar entre 2000 y 2100');
        if (mes < 1 || mes > 12)
            throw new BadInputError('El mes debe estar entre 1 y 12');
    }

    private static validateMeta(meta: number): void {
        if (meta < 0 || meta > 100)
            throw new BadInputError('La meta de cumplimiento debe estar entre 0 y 100');
    }



    get getId(): Id { return this.id; }
    get getAnio(): number { return this.anio; }
    get getMes(): number { return this.mes; }
    get getTipo(): TipoActividad { return this.tipo; }
    get getEstado(): EstadoCronograma { return this.estado; }
    get getMetaCumplimientoPct(): number { return this.metaCumplimientoPct; }
    get getCreadoPorId(): number { return this.creadoPorId; }
    get getNotas(): string | null { return this.notas; }
    get getCreatedAt(): Date { return this.createdAt; }
    get getUpdatedAt(): Date { return this.updatedAt; }
}

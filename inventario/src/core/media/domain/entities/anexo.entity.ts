import { EntidadTipoAnexo } from "@common/domain/enums";
import { Id } from "@common/domain/value-objects";


export class Anexo {
    private constructor(
        private readonly id: Id,
        private readonly entidadTipo: EntidadTipoAnexo,
        private readonly entidadId: Id,
        private readonly archivoId: number,
        private readonly nombre: string | null,
        private readonly orden: number,
        private readonly createdAt: Date,
        private readonly updatedAt: Date,
        private readonly observaciones?: string
    ) { }

    static create(data: {
        entidadTipo: EntidadTipoAnexo;
        entidadId: number;
        archivoId: number;
        nombre?: string;
        observaciones?: string;
        orden?: number;
    }): Anexo {
        if (!data.archivoId || data.archivoId <= 0)
            throw new Error('El archivoId debe ser valido');
        return new Anexo(
            new Id(),
            data.entidadTipo,
            new Id(data.entidadId),
            data.archivoId,
            data.nombre ?? null,
            data.orden ?? 0,
            new Date(),
            new Date(),
            data.observaciones
        );
    }

    static rebuild(
        id: number,
        entidadTipo: EntidadTipoAnexo,
        entidadId: number,
        archivoId: number,
        nombre: string | null,
        orden: number,
        createdAt: Date,
        updatedAt: Date,
        observaciones?: string
    ): Anexo {
        return new Anexo(
            new Id(id),
            entidadTipo,
            new Id(entidadId),
            archivoId,
            nombre,
            orden,
            createdAt,
            updatedAt,
            observaciones
        );
    }

    get getId(): Id { return this.id; }
    get getEntidadTipo(): EntidadTipoAnexo { return this.entidadTipo; }
    get getEntidadId(): Id { return this.entidadId; }
    get getArchivoId(): number { return this.archivoId; }
    get getNombre(): string | null { return this.nombre; }
    get getObservaciones(): string | undefined { return this.observaciones; }
    get getOrden(): number { return this.orden; }
    get getCreatedAt(): Date { return this.createdAt; }
    get getUpdatedAt(): Date { return this.updatedAt; }
}

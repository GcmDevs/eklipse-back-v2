import { Id } from "@common/domain/value-objects";

export class EquipoBaja {
    private constructor(
        private readonly id: Id,
        private readonly equipoId: Id,
        private readonly archivoActaId: Id,
        private readonly motivo: string,
        private readonly usuarioId: Id,
        private readonly fechaBaja: Date,
        private readonly createdAt: Date,
        private readonly observaciones?: string | null,
    ) { }

    static create(data: {
        equipoId: number;
        archivoActaId: number;
        motivo: string;
        usuarioId: number;
        fechaBaja?: Date,
        observaciones?: string;
    }): EquipoBaja {
        return new EquipoBaja(
            new Id(),
            new Id(data.equipoId),
            new Id(data.archivoActaId),
            data.motivo.trim(),
            new Id(data.usuarioId),
            data?.fechaBaja ?? new Date(),
            new Date(),
            data.observaciones?.trim() ?? null,
        );
    }

    static rebuild(
        id: number,
        equipoId: number,
        archivoActaId: number,
        motivo: string,
        usuarioId: number,
        fechaBaja: Date,
        createdAt: Date,
        observaciones?: string | null,
    ): EquipoBaja {

        return new EquipoBaja(
            new Id(id),
            new Id(equipoId),
            new Id(archivoActaId),
            motivo,
            new Id(usuarioId),
            fechaBaja,
            createdAt,
            observaciones ?? null,
        );
    }

    get getId(): Id {
        return this.id;
    }
    get getEquipoId(): Id {
        return this.equipoId;
    }
    get getArchivoActaId(): Id {
        return this.archivoActaId;
    }
    get getMotivo(): string {
        return this.motivo;
    }
    get getUsuarioId(): Id {
        return this.usuarioId;
    }
    get getFechaBaja(): Date {
        return this.fechaBaja;
    }
    get getCreatedAt(): Date {
        return this.createdAt;
    }
    get getObservaciones(): string | null {
        return this.observaciones ?? null;
    }
}
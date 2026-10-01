import { MotivoAsignacionActividad, MotivoFinalizacionAsignacionActividad } from '@equipos/domain/enums';
import { Column } from 'typeorm';

export class MotivoFinalizacionActividadEmbedded {
    @Column({
        name: 'MOTIVOFINALIZACION',
        type: 'nvarchar',
        length: 30,
        nullable: true,
    })
    motivo: MotivoFinalizacionAsignacionActividad | null;

    @Column({
        name: 'MOTIVOFINALIZACIONDETALLE',
        type: 'nvarchar',
        length: 210,
        nullable: true,
    })
    detalle: string | null;
}


export class MotivoAsignacionActividadEmbedded {
    @Column({
        name: 'MOTIVO',
        type: 'nvarchar',
        length: 30,
        nullable: true,
    })
    motivo: MotivoAsignacionActividad | null;

    @Column({
        name: 'MOTIVODETALLE',
        type: 'nvarchar',
        length: 210,
        nullable: true,
    })
    detalle: string | null;
}
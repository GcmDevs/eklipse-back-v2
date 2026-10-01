import { MotivoAsignacionRecursoUsuario, MotivoFinalizacionAsignacionRecursoUsuario } from '@equipos/domain/enums';
import { Column } from 'typeorm';

export class MotivoFinalizacionAsignacionTecnicoEmbedded {
    @Column({
        name: 'MOTIVOFINALIZACION',
        type: 'nvarchar',
        length: 30,
        nullable: true,
    })
    motivo: MotivoFinalizacionAsignacionRecursoUsuario | null;

    @Column({
        name: 'MOTIVOFINALIZACIONDETALLE',
        type: 'nvarchar',
        length: 210,
        nullable: true,
    })
    detalle: string | null;
}


export class MotivoAsignacionAsignacionTecnicoEmbedded {
    @Column({
        name: 'MOTIVO',
        type: 'nvarchar',
        length: 30,
        nullable: true,
    })
    motivo: MotivoAsignacionRecursoUsuario | null;

    @Column({
        name: 'MOTIVODETALLE',
        type: 'nvarchar',
        length: 210,
        nullable: true,
    })
    detalle: string | null;
}
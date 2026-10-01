import { TABLE_NAMES } from "@common/application/constants";
import {
    BaseCreatedOrm
} from "@common/infrastructure/orm";

import { ArchivoAlmacenadoOrm } from "@orm/cor";
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    Unique
} from "typeorm";
import { EquipoOrm } from "./equipo.orm";

@Entity({ name: TABLE_NAMES.inn.eqp.baja_equipo })
@Unique('UQ_EKINNEQPBAJAEQUIPOS_EQUIPO', ['equipo'])
export class EquipoBajaOrm extends BaseCreatedOrm {
    @OneToOne(() => EquipoOrm, equipo => equipo.baja)
    @JoinColumn({ name: 'EQUIPOOID' })
    equipo: EquipoOrm;

    @ManyToOne(() => ArchivoAlmacenadoOrm, {
        nullable: false,
        eager: false
    })
    @JoinColumn({ name: 'ARCHIVOACTAOID' })
    archivoActa: ArchivoAlmacenadoOrm;

    @Column({
        name: 'MOTIVO',
        type: 'nvarchar',
        length: 300,
        nullable: false
    })
    motivo: string;

    @Column({
        name: 'USUARIORESPONSABLEOID',
        type: 'int',
        nullable: false
    })
    usuarioResponsableId: number;

    @Column({
        name: 'FECHABAJA',
        type: 'date',
        nullable: false
    })
    fechaBaja: Date;

    @Column({
        name: 'OBSERVACIONES',
        type: 'nvarchar',
        length: 500,
        nullable: true
    })
    observaciones?: string;
}
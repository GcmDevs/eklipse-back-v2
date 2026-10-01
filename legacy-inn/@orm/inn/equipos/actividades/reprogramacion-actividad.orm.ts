import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { MotivoReprogramacionActividad } from '@equipos/domain/enums';
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { PlanActividadOrm } from "./plan-actividad.orm";
import { RegistroActividadOrm } from "./registro-actividad.orm";

@Entity({ name: TABLE_NAMES.inn.eqp.actividades.reprogramaciones_actividades })
@Index('UQ_EKINNEQPACTREGSREPROGSACTIVIDAD_ACTIVA', ['registroActividad'], {
    unique: true,
    where: 'ACTIVA = 1',
})
export class ReprogramacionActividadOrm extends BaseTimestampedOrm {
    @ManyToOne(() => PlanActividadOrm)
    @JoinColumn({ name: 'PLANACTIVIDADOID' })
    planActividad: PlanActividadOrm;

    @Column({ name: 'EQUIPOOID', type: 'int', nullable: false })
    equipoId: number;

    @ManyToOne(() => RegistroActividadOrm, regActividad => regActividad.reprogramaciones)
    @JoinColumn({ name: 'REGACTIVIDADOID' })
    registroActividad: RegistroActividadOrm;

    @Column({ name: 'FECHPROGRAMADAORIGINAL', type: 'date', nullable: false })
    fechaProgramaOriginal: Date;

    @Column({ name: 'FECHREPROGRAMADA', type: 'date', nullable: false })
    fechaReprogramada: Date;

    @Column({ name: 'MOTIVO', enum: MotivoReprogramacionActividad, nullable: false })
    motivo: MotivoReprogramacionActividad;

    @Column({ name: 'MOTIVODETALLE', type: 'nvarchar', length: 400, nullable: true })
    motivoDetalle?: string;

    @Column({ name: 'ACTIVA', type: 'bit' })
    activa: boolean;
}
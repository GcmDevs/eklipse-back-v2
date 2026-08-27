import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('EKHPNCIRSEG')
@Index('UX_CIRUGIASEGUIMIENTO_CONSEC', ['pcnConsec'], { unique: true })
export class SeguimientoCirugiaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' }) id: number;
  @Column({ name: 'PCNCONSEC', type: 'varchar', length: 50 }) pcnConsec: string;
  @Column({ name: 'ESTADOACTUAL', type: 'varchar', length: 50 }) estadoActual: string;
  @Column({ name: 'FECHAINICIOPREPARACION', type: 'datetime', nullable: true })
  fechaInicioPreparacion?: Date | null;
  @Column({ name: 'FECHAINICIOCIRUGIA', type: 'datetime', nullable: true })
  fechaInicioCirugia?: Date | null;
  @Column({ name: 'FECHAINICIORECUPERACION', type: 'datetime', nullable: true })
  fechaInicioRecuperacion?: Date | null;
  @Column({ name: 'FECHAFINALIZACION', type: 'datetime', nullable: true })
  fechaFinalizacion?: Date | null;
  @Column({ name: 'USUARIOMODIFICACIONID', type: 'bigint' }) usuarioModificacionId: number;
  @Column({ name: 'USUARIOMODIFICACIONNOMBRE', type: 'varchar', length: 150, default: '' })
  usuarioModificacionNombre: string;
  @CreateDateColumn({ name: 'CREATEDAT', type: 'datetime' }) createdAt: Date;
  @UpdateDateColumn({ name: 'UPDATEDAT', type: 'datetime' }) updatedAt: Date;
}

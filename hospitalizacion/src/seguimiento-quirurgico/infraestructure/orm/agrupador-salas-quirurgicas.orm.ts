import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AgrupadorSalaQuirurgicaOrm } from './agrupador-sala-quirurgica.orm';

@Entity('EKHPNCIRAGR')
@Index('UQ_EKHPNCIRAGR_NOMBRE', ['nombre'], { unique: true })
export class AgrupadorSalasQuirurgicasOrm {
  @PrimaryGeneratedColumn({ name: 'OID' }) id: number;
  @Column({ name: 'NOMBRE', type: 'nvarchar', length: 150 }) nombre: string;
  @Column({ name: 'ACTIVO', type: 'bit', default: true }) activo: boolean;
  @CreateDateColumn({ name: 'CREATEDAT', type: 'datetime' }) createdAt: Date;
  @UpdateDateColumn({ name: 'UPDATEDAT', type: 'datetime', nullable: true }) updatedAt?: Date;
  @OneToMany(() => AgrupadorSalaQuirurgicaOrm, sala => sala.agrupador) salas: AgrupadorSalaQuirurgicaOrm[];
}

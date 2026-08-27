import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('EKHPNCIRUSU')
@Index('UQ_EKHPNCIRUSU_USUARIO_SALAQX', ['usuarioDocumento', 'salaQx'], { unique: true })
export class AsignacionQuirofanoUsuarioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' }) id: number;
  @Column({ name: 'USUARIODOCUMENTO', type: 'varchar', length: 30 }) usuarioDocumento: string;
  @Column({ name: 'SALAQX', type: 'varchar', length: 50 }) salaQx: string;
  @Column({ name: 'ACTIVO', type: 'bit', default: true }) activo: boolean;
  @Column({ name: 'ESPREDETERMINADO', type: 'bit', default: false }) esPredeterminado: boolean;
  @CreateDateColumn({ name: 'CREATEDAT', type: 'datetime' }) createdAt: Date;
  @UpdateDateColumn({ name: 'UPDATEDAT', type: 'datetime', nullable: true }) updatedAt?: Date;
}

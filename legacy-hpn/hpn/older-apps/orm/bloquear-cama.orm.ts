import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { UsuarioOrm } from './general';
import { CamaOrm } from './cama.orm';
import { MotivoBloqueoCamaOrm } from './motivo-bloqueo.orm';

@Entity('EKHPNBLOQUEOC')
export class BloqueoCamaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HPNDEFCAM' })
  camaId: number;

  @ManyToOne(() => CamaOrm)
  @JoinColumn({ name: 'HPNDEFCAM', referencedColumnName: 'id' })
  cama: CamaOrm;

  @OneToMany(() => MotivoBloqueoCamaOrm, motivo => motivo.bloqueo, { cascade: true, eager: true })
  motivos: MotivoBloqueoCamaOrm[];

  @Column({ name: 'FECHACREACION' })
  createdAt: Date;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'GENUSUARIO', referencedColumnName: 'id' })
  usuario: UsuarioOrm;

  @Column({ name: 'OBSERVACION' })
  observacion: string;
}

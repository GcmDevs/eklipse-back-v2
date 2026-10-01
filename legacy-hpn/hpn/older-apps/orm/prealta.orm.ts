import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CamaOrm } from './cama.orm';
import { UsuarioOrm } from './general';
import { PrealtaCode } from '../types/prealta';

@Entity('EKHPNPREALTA')
export class PrealtaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HPNDEFCAM' })
  camaId: number;

  @Column({ name: 'MOTIVO' })
  motivo: PrealtaCode;

  @ManyToOne(() => CamaOrm)
  @JoinColumn({ name: 'HPNDEFCAM', referencedColumnName: 'id' })
  cama: CamaOrm;

  @Column({ name: 'FECHACREACION' })
  createdAt: Date;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'GENUSUARIO', referencedColumnName: 'id' })
  usuario: UsuarioOrm;

  @Column({ name: 'ACTIVO' })
  activo: boolean;

  @Column({ name: 'OBSERVACION' })
  observacion: string;
}

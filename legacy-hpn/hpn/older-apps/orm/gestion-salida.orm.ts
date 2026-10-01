import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IngresoOrm, UsuarioOrm } from './general';

@Entity('EKHPNGESAL')
export class GestionSalidaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'SRACONSEC' })
  consecutivo: number;

  @Column({ name: 'FECHASALIDA' })
  fechaSalida: Date;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn({ name: 'AINCONSEC', referencedColumnName: 'id' })
  ingreso: IngresoOrm;

  @Column({ name: 'AINCONSEC' })
  ingresoId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'USUCREORDSAL', referencedColumnName: 'id' }])
  usuCreoOrdenSalida: UsuarioOrm;

  @Column({ name: 'USUCREORDSAL' })
  usuCreoOrdenSalidaId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'USUCONFIRSAL', referencedColumnName: 'id' }])
  usuConfirmSal: UsuarioOrm;

  @Column({ name: 'USUCONFIRSAL' })
  usuConfirmSalId: number;

  @Column({ name: 'FECHACREACION' })
  createdAt: Date;
}

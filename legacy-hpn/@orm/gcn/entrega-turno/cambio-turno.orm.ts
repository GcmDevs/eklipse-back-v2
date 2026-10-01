import { TABLE_NAMES } from '@common/application/constants';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EntregaTurnoOrm } from './entrega-turno.orm';
import { UsuarioOrm } from '@orm/gen';

@Entity(TABLE_NAMES.hpn.entregaTurno.combioTurno)
export class CambioTurnoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: TABLE_NAMES.hpn.entregaTurno.index })
  entregaTurnoId: number;

  @ManyToOne(() => EntregaTurnoOrm)
  @JoinColumn({ name: TABLE_NAMES.hpn.entregaTurno.index })
  entregaTurno: EntregaTurnoOrm;

  @Column({ name: 'MEDICO' })
  medicoId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'MEDICO' })
  medico: UsuarioOrm;

  @Column({ name: 'MOTIVO' })
  motivo: string;

  @Column({ name: 'FECHA' })
  fecha: Date;

  @Column({ name: 'TIPO' })
  tipo: number;
}

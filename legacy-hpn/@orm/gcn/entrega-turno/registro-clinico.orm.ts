import { TABLE_NAMES } from '@common/application/constants';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ETPacienteTurnoOrm } from './paciente-turno.orm';
import { UsuarioOrm } from '@orm/gen';

@Entity(TABLE_NAMES.hpn.entregaTurno.registroClinico)
export class ETRegistroClinicoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;
  /* 
  old
  @Column({ name: TABLE_NAMES.hpn.entregaTurno.pacienteTurno })
  pacienteTurnoId: number; */

  @Column({ name: 'EKHPNENTREGATURNOPACIENTE' })
  pacienteTurnoId: number;

  /*   @Column({ name: TABLE_NAMES.hpn.entregaTurno.index })
    entregaTurnoId: number;
   */
  /*   @Column({ name: TABLE_NAMES.adn.ingresos })
  ingresoId: number;
 */
  @Column({ name: 'FECHAREGISTRO' })
  fechaRegistro: Date;

  @Column({ name: 'DIAGNOSTICO' })
  diagnostico: string;

  @Column({ name: 'REPORTELAB' })
  reporteLab: string;

  @Column({ name: 'PENDIENTES' })
  pendientes: string;

  @Column({ name: 'REPORTEIMG' })
  reporteImg: string;

  @Column({ name: 'ESPECIALIDADTRATANTE' })
  especialidadTratante: string;

  @Column({ name: 'TRATAMIENTO' })
  tratamiento: string;

  @OneToOne(() => ETPacienteTurnoOrm, paciente => paciente.registroClinico)
  @JoinColumn({ name: 'EKHPNENTREGATURNOPACIENTE' })
  pacienteTurno: ETPacienteTurnoOrm;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'GENUSUARIO' })
  usuario: UsuarioOrm;
}

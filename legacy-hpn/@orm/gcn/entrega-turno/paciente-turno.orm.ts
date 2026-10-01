import { TABLE_NAMES } from '@common/application/constants';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EntregaTurnoOrm } from './entrega-turno.orm';
import { ETRegistroClinicoOrm } from './registro-clinico.orm';
import { PacienteEvolucionOrm } from './paciente-evolucion.orm';

@Entity(TABLE_NAMES.hpn.entregaTurno.pacienteTurno)
export class ETPacienteTurnoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  /* OLD */
  /*   @Column({ name: 'GENPACIEN' })
  pacienteId: number;
 */
  /* nuevo */
  @Column({ name: 'PACIENTEEVOLUCION' })
  pacienteEvolucionId: number;

  @ManyToOne(() => PacienteEvolucionOrm)
  @JoinColumn({ name: 'PACIENTEEVOLUCION' })
  pacienteEvolucion: PacienteEvolucionOrm;

  @Column({ name: TABLE_NAMES.hpn.entregaTurno.index })
  entregaTurnoId: number;

  @ManyToOne(() => EntregaTurnoOrm, entregaTurno => entregaTurno.pacientesTurnos)
  @JoinColumn({ name: TABLE_NAMES.hpn.entregaTurno.index })
  entregaTurno: EntregaTurnoOrm;

  @Column({ name: TABLE_NAMES.hpn.entregaTurno.registroClinico })
  registroClinicoId: number;

  @OneToOne(() => ETRegistroClinicoOrm, registro => registro.pacienteTurno)
  registroClinico: ETRegistroClinicoOrm;

  @Column({ name: 'ISENTREGADO' })
  isEntregado: boolean;

  @Column({ name: 'ISRECIBIDO' })
  isRecibido: boolean;

  /* CAMPOS NUEVOS */

  /*   @Column({ name: 'ISENTREGADO' })
    isEntregado: number;
  
    @Column({ name: 'ISRECIBIDO' })
    isRecibido: number; */

  /*  @ManyToOne(() => ETRegistroClinicoOrm, registro => registro.pacienteTurno)
   @JoinColumn([{ name: TABLE_NAMES.hpn.entregaTurno.registroClinico, referencedColumnName: 'id' }])
   registroClinico: ETRegistroClinicoOrm; */


  /* ODL */
  /*   @ManyToOne(() => PacienteOrm, paciente => paciente.pacientesTurnos)
  @JoinColumn([{ name: 'GENPACIEN', referencedColumnName: 'id' }])
  paciente: PacienteOrm; */
}

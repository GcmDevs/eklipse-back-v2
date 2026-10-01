import { TABLE_NAMES } from '@common/application/constants';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ETPacienteTurnoOrm } from './paciente-turno.orm';
import { UsuarioOrm } from '@orm/gen';
import { SubgrupoOrm } from '@orm/temp';
import { EstadoTypeCode } from '@gestion-clinica/entrega-turnos/application/types';
import { CambioTurnoOrm } from './cambio-turno.orm';

@Entity(TABLE_NAMES.hpn.entregaTurno.index)
export class EntregaTurnoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HPNSUBGRU' })
  subgrupoId: number;

  @Column({ name: 'ADNCENATE' })
  centroAtencionId: number;

  @Column({ name: 'FECHA' })
  fecha: Date;

  @Column({ name: 'MEDICOENTREGA' })
  medicoEntregaTurnoId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'MEDICOENTREGA', referencedColumnName: 'id' }])
  medicoEntrega: UsuarioOrm;

  @Column({ name: 'MEDICORECIBE' })
  medicoRecibeTurnoId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'MEDICORECIBE', referencedColumnName: 'id' }])
  medicoRecibe: UsuarioOrm;

  @Column({ name: 'FECHAENTREGA' })
  fechaEntrega: Date;

  @Column({ name: 'FECHARECIBIDO' })
  fechaRecibido: Date;

  @Column({ name: 'ESTADO' })
  estadoCode: EstadoTypeCode;

  @OneToMany(() => ETPacienteTurnoOrm, paciente => paciente.entregaTurno)
  pacientesTurnos: ETPacienteTurnoOrm[];

  @ManyToOne(() => SubgrupoOrm)
  @JoinColumn([{ name: 'HPNSUBGRU', referencedColumnName: 'id' }])
  subgrupo: SubgrupoOrm;

  @Column({ name: 'OBSERVACION' })
  observacion: string;

  @Column({ name: 'ISACTIVO' })
  isActivo: boolean;

  @Column({ name: 'HABILITADOPOR' })
  habilitadoId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'HABILITADOPOR' }])
  habilitador: UsuarioOrm;

  @OneToMany(() => CambioTurnoOrm, cambio => cambio.entregaTurno)
  cambiosTurno: CambioTurnoOrm[];
}

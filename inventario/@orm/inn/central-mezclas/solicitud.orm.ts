import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PacienteExternoOrm } from './paciente-externo.orm';
import { EstadoCode, LineaCode, PrioridadCode } from '@inn/types/inn/central-mezclas';
import { UsuarioOrm } from '@inn/orm/gen';
import { MedicamentoSeleccionOrm } from './medicamento-seleccion.orm';

@Entity('EKINNCTMZSOLI')
export class SolicitudOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GENUSUEXT' })
  usuarioExternoId: number;

  @Column({ name: 'EKINNCTMZPACEXT' })
  pacienteExternoId: number;

  @ManyToOne(() => PacienteExternoOrm, paciente => paciente.solicitudes)
  @JoinColumn({ name: 'EKINNCTMZPACEXT', referencedColumnName: 'id' })
  pacienteExterno: PacienteExternoOrm;

  @OneToMany(() => MedicamentoSeleccionOrm, medicamento => medicamento.solicitud)
  seleccion: MedicamentoSeleccionOrm[];

  @Column({ name: 'LINEA' })
  lineaCode: LineaCode;

  @Column({ name: 'ESTADO' })
  estadoCode: EstadoCode;

  @Column({ name: 'PRIORIDAD' })
  prioridadCode: PrioridadCode;

  @Column({ name: 'FECHACREA' })
  fechaCreacion: Date;

  @Column({ name: 'GENUSUARIO1', nullable: true })
  usuarioResponsableId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'GENUSUARIO1', referencedColumnName: 'id' })
  usuarioResponsable: UsuarioOrm;

  @Column({ name: 'GENUSUOBS', length: 500, nullable: true })
  usuResObs: string;
}

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PacienteExternoOrm } from './paciente-externo.orm';
import { EstadoCode, LineaCode, PrioridadCode } from '@inn/types/inn/central-mezclas';
import { UsuarioOrm } from '@inn/orm/gen';
import { MedicamentoSeleccionOrm } from './medicamento-seleccion.orm';
import { NutricionParenteralOrm } from './nutricion-parenteral.orm';

@Entity('EKINNCTMZSOLI')
export class SolicitudOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GENUSUARIO' })
  usuarioExternoId: number;

  @Column({ name: 'ISEXTERNO' })
  isExterno: boolean;

  @Column({ name: 'EKINNCTMZPACEXT' })
  pacienteExternoId: number;

  @ManyToOne(() => PacienteExternoOrm, paciente => paciente.solicitudes)
  @JoinColumn({ name: 'EKINNCTMZPACEXT', referencedColumnName: 'id' })
  pacienteExterno: PacienteExternoOrm;

  @OneToMany(() => MedicamentoSeleccionOrm, medicamento => medicamento.solicitud)
  seleccion: MedicamentoSeleccionOrm[];

  @OneToOne(() => NutricionParenteralOrm, nutricionParenteral => nutricionParenteral.solicitud)
  nutricionParenteral: NutricionParenteralOrm;

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
}

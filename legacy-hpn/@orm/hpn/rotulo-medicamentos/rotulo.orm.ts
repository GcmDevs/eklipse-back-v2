import { IngresoOrm, PacienteOrm, UsuarioOrm } from '@orm/gen';
import { MedicamentoOrm } from '@orm/gen/pacientes/medicamento.orm';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('EKHPNROTULOS')
export class RotuloOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn([{ name: 'INGRESO', referencedColumnName: 'id' }])
  ingreso: IngresoOrm;

  @Column({ name: 'INGRESO' })
  ingresoId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => PacienteOrm)
  @JoinColumn([{ name: 'GENPACIEN', referencedColumnName: 'id' }])
  paciente: PacienteOrm;

  @Column({ name: 'GENPACIEN' })
  pacienteId: number;

  @ManyToOne(() => MedicamentoOrm)
  @JoinColumn([{ name: 'PRODUCTO', referencedColumnName: 'id' }])
  producto: MedicamentoOrm;

  @Column({ name: 'PRODUCTO' })
  productoId: number;

  //   @Column({ name: 'SERVICIO' })
  //   servicio: string;

  //   @Column({ name: 'ESTADO' })
  //   estado: number;

  //   @Column({ name: 'OBSERVACION', nullable: true })
  //   observacion: string;

  @Column({ name: 'CREATEDAT', type: 'datetime', nullable: true })
  createdAt: Date;
}

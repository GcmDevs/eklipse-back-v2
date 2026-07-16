import { IngresoOrm } from '@orm/adn';
import { PacienteOrm } from '@orm/gen/pacientes';
import { UsuarioOrm } from '@orm/gen/usuarios';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { MedicamentoOrm } from './medicamento.orm';

@Entity('EKHPNROTULOMEDICAMENTOS')
export class RotuloMedicamentoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn([{ name: 'INGRESO', referencedColumnName: 'id' }])
  ingreso: IngresoOrm;

  @Column({ name: 'INGRESO' })
  ingresoId: number;

  @Column({ name: 'FOLIO' })
  folio: number;

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
  @JoinColumn([{ name: 'PRODUCTOID', referencedColumnName: 'id' }])
  producto: MedicamentoOrm;

  @Column({ name: 'PRODUCTOID' })
  productoId: number;

  @Column({ name: 'CAMA', type: 'nvarchar', length: 50 })
  cama: string;

  @Column({ name: 'FECHAROTULO', type: 'datetime' })
  fechaRotulo: Date;

  @Column({ name: 'SERVICIO', type: 'nvarchar', length: 100, nullable: true })
  servicio: string;

  @Column({ name: 'DOSIS', type: 'decimal', precision: 18, scale: 2 })
  dosis: number;

  @Column({ name: 'VIAADMINISTRACION', type: 'nvarchar', length: 50, nullable: true })
  viaAdministracion: string;

  @Column({ name: 'INICIO', type: 'nvarchar', length: 10, nullable: true })
  inicio: string;

  @Column({ name: 'UNIDADMEDIDA', type: 'nvarchar', length: 20, default: 'ACTIVO' })
  unidadMedida: string;

  @Column({ name: 'ACTIVO', type: 'tinyint' })
  activo: boolean;

  @Column({ name: 'GUARDADO', type: 'tinyint' })
  guardado: boolean;

  @Column({ name: 'CANTIDAD', type: 'int' })
  cantidad: number;

  @Column({ name: 'CREATEDAT', type: 'datetime' })
  createdAt: Date;

  @Column({ name: 'UPDATEDAT', type: 'datetime', nullable: true })
  updatedAt: Date;
}

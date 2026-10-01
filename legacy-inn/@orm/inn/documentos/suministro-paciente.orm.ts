import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Column } from 'typeorm';
import { DetalleSuministroPacienteOrm } from './suministro-paciente.detalle.orm';
import { TABLE_NAMES } from '@common/application/constants';
import { TIPOS_DOCUMENTO } from '@ctypes/inn/documentos';
import { DocumentoOrm } from '@orm/inn/documentos';
import { IngresoOrm } from '@orm/gen';

@Entity(TABLE_NAMES.inn.dcm.smp.suministroPaciente)
export class SuministroPacienteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  tipo = TIPOS_DOCUMENTO.SUMINISTRO_PACIENTE;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn([{ name: TABLE_NAMES.adn.ingresos, referencedColumnName: 'id' }])
  ingreso: IngresoOrm;

  @Column({ name: TABLE_NAMES.adn.ingresos })
  ingresoId: number;

  @OneToMany(() => DetalleSuministroPacienteOrm, detalle => detalle.suministroPaciente)
  detalle: DetalleSuministroPacienteOrm[];

  isListoParaEntrega = false;
}

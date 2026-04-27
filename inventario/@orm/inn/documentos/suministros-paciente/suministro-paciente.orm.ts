import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Column } from 'typeorm';
import { DetalleSuministroPacienteOrm } from './suministro-paciente.detalle.orm';
import { TIPOS_DOCUMENTO } from '@inn/types/inn/documentos';
import { DocumentoOrm } from '../documento.orm';
import { IngresoOrm } from '@inn/orm/adn';

@Entity('INNCSUMPA')
export class SuministroPacienteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  tipo = TIPOS_DOCUMENTO.SUMINISTRO_PACIENTE;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @Column({ name: 'ADNINGRESO' })
  ingresoId: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn([{ name: 'ADNINGRESO', referencedColumnName: 'id' }])
  ingreso: IngresoOrm;

  @OneToMany(() => DetalleSuministroPacienteOrm, detalle => detalle.suministroPaciente)
  detalle: DetalleSuministroPacienteOrm[];

  isListoParaEntrega: boolean;
  isEntregado: boolean;
}

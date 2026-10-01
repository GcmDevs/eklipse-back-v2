import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Column } from 'typeorm';
import { DevolucionSumPacOrm } from '@inn/docs/sumpac/infrastructure/orm/devolucion-tradicional';
import { DocumentoOrm } from '../documento/documento.orm';
import { TIPOS_DOCUMENTO } from '@inn/ek-types/inn/documentos';
import { DetalleSuministroPacienteOrm } from './detalle.orm';
import { AreaServicioOrm } from '@inn/orm/gen';
import { IngresoOrm } from '@inn/orm/adn';

@Entity('INNCSUMPA')
export class SuministroPacienteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  tipo = TIPOS_DOCUMENTO.suministroPaciente;

  @ManyToOne(() => AreaServicioOrm)
  @JoinColumn([{ name: 'GENARESER', referencedColumnName: 'id' }])
  areaServicio: AreaServicioOrm;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn([{ name: 'ADNINGRESO', referencedColumnName: 'id' }])
  ingreso: IngresoOrm;

  @Column({ name: 'GENARESER' })
  areaServicioId: number;

  @Column({ name: 'ADNINGRESO' })
  ingresoId: number;

  @OneToMany(() => DetalleSuministroPacienteOrm, detalle => detalle.suministroPaciente)
  detalle: DetalleSuministroPacienteOrm[];

  infoDevolucion: DevolucionSumPacOrm;
}

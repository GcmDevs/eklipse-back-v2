import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { TipoHistoriaOrm } from './tipo-historia.orm';
import { EspecialidadOrm, MedicoOrm } from '@hpn/lgc/aud/orm/gen/medicos';

@Entity(TABLE_NAMES.hcn.folios.index)
export class FolioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HCFECFOL' })
  fechaCreacion: Date;

  @Column({ name: TABLE_NAMES.adn.ingresos })
  ingresoId: number;

  @Column({ name: TABLE_NAMES.gen.medicos.index })
  medicoId: number;

  @Column({ name: TABLE_NAMES.gen.medicos.especialidad })
  especialidadId: number;

  @Column({ name: TABLE_NAMES.hcn.folios.tipoHistoria })
  tipoHistoriaId: number;

  @ManyToOne(() => MedicoOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.medicos.index, referencedColumnName: 'id' }])
  medico: MedicoOrm;

  @ManyToOne(() => EspecialidadOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.medicos.especialidad, referencedColumnName: 'id' }])
  especialidad: EspecialidadOrm;

  @ManyToOne(() => TipoHistoriaOrm)
  @JoinColumn([{ name: TABLE_NAMES.hcn.folios.tipoHistoria, referencedColumnName: 'id' }])
  tipoHistoria: TipoHistoriaOrm;
}

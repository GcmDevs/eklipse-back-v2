import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoordenadasEmbeddable } from './supports';
import { MunicipioOrm } from '@orm/shared-bd';

@Entity({ name: 'GCNESTACIONESSERVICIO' })
export class EstacionServicioOrm extends BaseTimestampedOrm {
  @Column({ name: 'NOMBRE', type: 'nvarchar', length: 150 })
  nombre: string;

  @Column({ name: 'DIRECCION', type: 'nvarchar', length: 100 })
  direccion: string;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 200, nullable: true })
  observaciones?: string;

  @ManyToOne(() => MunicipioOrm, { nullable: false })
  @JoinColumn({ name: 'MUNICIPIOOID' })
  municipio?: MunicipioOrm;

  @Column(() => CoordenadasEmbeddable, { prefix: 'UBIC' })
  ubicacion?: CoordenadasEmbeddable;

  @Column({ name: 'ACTIVA', type: 'bit', default: true })
  activa: boolean;

  @Column({ name: 'CREADAPOROID', type: 'int', nullable: true })
  creadaPorUsuarioId?: number;

  @Column({ name: 'CREADAPORCTX', type: 'nvarchar', length: 20, nullable: true })
  creadaPorContexto?: string;
}

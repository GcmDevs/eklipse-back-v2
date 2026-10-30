import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ModeloOrm } from '../marca';
import { EquipoOrm } from '../equipo.orm';
import { SubclaseEquipoOrm } from './subclase-equipo.orm';
import { AccesorioTipoEquipoOrm } from './accesorio-tipo-equipo.orm';
import { DocumentoTipoEquipoOrm } from './documento-tipo-equipo.orm';
import { PlanDefaultTipoEquipoOrm } from './plan-default-tipo-equipo.orm';
import { FichaTecnicaTipoEquipoEmbeddable } from '../supports';
import { TipoActivoOrm } from './tipo-activo.orm';

@Entity({ name: TABLE_NAMES.inn.eqp.tipos_equipo })
export class TipoEquipoOrm extends BaseTimestampedOrm {
  @Column({ name: 'NOMBRE', type: 'varchar', length: 200 })
  nombre: string;

  @ManyToOne(() => ModeloOrm, modelo => modelo.tiposEquipo)
  @JoinColumn({ name: 'MODELOOID' })
  modelo: ModeloOrm;

  @ManyToOne(() => SubclaseEquipoOrm, sub => sub.tiposEquipo)
  @JoinColumn({ name: 'SUBCLASEOID' })
  subclase: SubclaseEquipoOrm;

  @ManyToOne(() => TipoActivoOrm)
  @JoinColumn({ name: 'TIPOACTIVOOID' })
  tipoActivo: TipoActivoOrm;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 500, nullable: true })
  observaciones?: string;

  @Column({ name: 'ACTIVO', type: 'bit', default: true })
  activo: boolean;

  @Column(() => FichaTecnicaTipoEquipoEmbeddable, { prefix: 'FTEC' })
  fichaTecnica?: FichaTecnicaTipoEquipoEmbeddable;

  @OneToMany(() => AccesorioTipoEquipoOrm, acc => acc.tipoEquipo)
  accesoriosEstandar: AccesorioTipoEquipoOrm[];

  @OneToMany(() => DocumentoTipoEquipoOrm, doc => doc.tipoEquipo)
  documentos: DocumentoTipoEquipoOrm[];

  @OneToMany(() => PlanDefaultTipoEquipoOrm, plan => plan.tipoEquipo)
  planesDefault: PlanDefaultTipoEquipoOrm[];

  @OneToMany(() => EquipoOrm, equipo => equipo.tipoEquipoRel)
  equipos: EquipoOrm[];
}

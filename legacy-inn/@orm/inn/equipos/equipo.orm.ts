import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { EstadoEquipo } from '@equipos/domain/enums';
import { RegistroFotografico } from '@equipos/domain/value-objects';
import { ResponsableView } from '@orm/cor';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, Unique } from 'typeorm';
import { AccesorioUnidadOrm } from './accesorio-unidad.orm';
import { RegistroActividadOrm } from './actividades';
import { PlanActividadOrm } from './actividades/plan-actividad.orm';
import { CompraOrm } from './adquisicion/compra.orm';
import { EquipoBajaOrm } from './baja-equipo.orm';
import { PlanDefaultTipoEquipoOrm } from './catalogo/plan-default-tipo-equipo.orm';
import { TipoEquipoOrm } from './catalogo/tipo-equipo.orm';
import { registroFotograficoTransformer } from './supports';
import { EkCenterOrm } from '@orm/gen';

@Entity({ name: TABLE_NAMES.inn.eqp.iden_equipo })
@Unique('UQ_EKINNEQPIDEQUIPOS_NUMSERIE', ['numeroSerie'])
@Unique('UQ_EKINNEQPIDEQUIPOS_NUMPLACA', ['numeroPlaca'])
export class EquipoOrm extends BaseTimestampedOrm {
  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'CODIGO' })
  codigo: string;

  @Column({ name: 'NUMSERIE' })
  numeroSerie: string;

  @Column({ name: 'NUMPLACA' })
  numeroPlaca: string;

  @Column({ name: 'NUMEROINVENTARIO' })
  numeroInventario: string;

  // @ManyToOne(() => EkCenterOrm, { nullable: false})
  // @JoinColumn({name: 'SEDEOID'})
  // sede: EkCenterOrm;

  @ManyToOne(() => ResponsableView, { nullable: true, eager: false })
  @JoinColumn({
    name: 'RESPONSABLEOID',
    referencedColumnName: 'responsableId',
  })
  responsable: ResponsableView;

  @Column({ name: 'LOCALIZACION' })
  localizacion: string;

  @Column({
    name: 'ESTADO',
    type: 'varchar',
    length: 30,
    default: EstadoEquipo.FUNCIONANDO,
  })
  estado: EstadoEquipo;

  @Column({ name: 'ESLEGACY', type: 'bit', default: false, nullable: false })
  isLegacy: boolean;

  @Column({ name: 'FECHPUESTAFUNCIONAMIENTO', type: 'date', nullable: true })
  fechaPuestaFuncionamiento?: Date;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 420, nullable: true })
  observaciones?: string;

  @ManyToOne(() => TipoEquipoOrm, tipEqp => tipEqp.equipos)
  @JoinColumn({ name: 'TIPOEQUIPOOID' })
  tipoEquipoRel?: TipoEquipoOrm;

  @ManyToOne(() => CompraOrm, compra => compra.equipos, { nullable: true })
  @JoinColumn({ name: 'ADQUISICIONOID' })
  compra?: CompraOrm;

  @OneToMany(() => AccesorioUnidadOrm, acc => acc.equipo)
  accesoriosUnidad: AccesorioUnidadOrm[];

  @OneToMany(() => PlanActividadOrm, plan => plan.equipo, { cascade: true })
  planesActividad: PlanActividadOrm[];

  @OneToMany(() => RegistroActividadOrm, regsMantenimiento => regsMantenimiento.equipo)
  registrosMantenimientos: RegistroActividadOrm[];

  @OneToOne(() => EquipoBajaOrm, baja => baja.equipo, { nullable: true })
  baja?: EquipoBajaOrm;

  @ManyToOne(() => PlanDefaultTipoEquipoOrm, { nullable: true })
  @JoinColumn({ name: 'PLANMANTDEFAULTOID' })
  planDefaultMantenimiento?: PlanDefaultTipoEquipoOrm;

  @ManyToOne(() => PlanDefaultTipoEquipoOrm, { nullable: true })
  @JoinColumn({ name: 'PLANCALIBDEFAULTOID' })
  planDefaultCalibracion?: PlanDefaultTipoEquipoOrm;

  @Column({
    name: 'REGFOTOGRAFICO',
    type: 'nvarchar',
    length: 'MAX',
    nullable: true,
    default: () => "'[]'",
    transformer: registroFotograficoTransformer,
  })
  registroFotografico?: RegistroFotografico;
}

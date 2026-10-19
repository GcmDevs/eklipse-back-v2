import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { UsuarioOrm } from '@orm/gen';
import { OrigenTanqueo, TipoCombustible, UnidadMedidaCombustible } from '@vehiculos/domain/enums';
import { EstadoTanqueo } from '@vehiculos/domain/enums/estados.enum';
import { EvidenciasTanqueo } from '@vehiculos/domain/value-objects';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, Unique } from 'typeorm';
import { AbastecimientoOrm } from './abastecimiento.orm';
import { RepositorioCombustibleOrm } from './repositorio-combustible.orm';
import {
  CoordenadasEmbeddable,
  evidenciasTanqueoTransformer,
  OrigenRegistroEmbeddable,
} from './supports';
import { TanqueoInconsistenciaOrm } from './tanqueo-inconsistencia.orm';

@Entity({ name: 'GCNTANQUEOS' })
@Unique('UQ_GCNTANQUEOS_CODIGO', ['codigo'])
@Unique('UQ_GCNTANQUEOS_CLIENTEUUID', ['clienteUuid'])
export class TanqueoOrm extends BaseTimestampedOrm {
  @Column({ name: 'CODIGO', type: 'nvarchar', length: 20, nullable: true })
  codigo: string;

  @Column({ name: 'CLIENTEUUID', type: 'nvarchar', length: 36, nullable: true })
  clienteUuid?: string;

  @Column({ name: 'ACTIVOOID', type: 'int' })
  activoId: number;

  @Column({
    name: 'ORIGEN',
    enum: OrigenTanqueo,
    type: 'nvarchar',
    length: 12,
    default: OrigenTanqueo.ESTACION,
  })
  origen: OrigenTanqueo;

  @ManyToOne(() => RepositorioCombustibleOrm, { nullable: true })
  @JoinColumn({ name: 'REPOSITORIOOID' })
  repositorio?: RepositorioCombustibleOrm;

  @OneToOne(() => AbastecimientoOrm, abastecimiento => abastecimiento.tanqueo, { nullable: true })
  abastecimiento?: AbastecimientoOrm;

  @ManyToOne(() => UsuarioOrm, { nullable: false })
  @JoinColumn({ name: 'USUARIOOID' })
  usuario: UsuarioOrm;

  @Column({ name: 'KILOMETRAJE', type: 'int', nullable: true })
  kilometraje?: number;

  @Column({ name: 'KMRECORRIDOS', type: 'int', nullable: true })
  kilometrosRecorridos?: number;

  @Column({ name: 'VALORPAGADO', type: 'decimal', precision: 12, scale: 2, nullable: true })
  valorTotalPagado?: number;

  @Column({ name: 'CANTCOMBUST', type: 'decimal', precision: 8, scale: 3, nullable: true })
  cantidadCombustible?: number;

  @Column({
    name: 'UNIDADMEDCANTCOMBUST',
    enum: UnidadMedidaCombustible,
    type: 'nvarchar',
    length: 3,
    nullable: true,
  })
  unidadMedidaCombustible?: UnidadMedidaCombustible;

  @Column({ name: 'TIPOCOMBUST', enum: TipoCombustible, nullable: true })
  tipoCombustible?: TipoCombustible;

  @Column({ name: 'RENDIMIENTO', type: 'decimal', precision: 8, scale: 3, nullable: true })
  rendimiento?: number;

  @Column({ name: 'ESTACIONOID', type: 'int', nullable: true })
  estacionServicioId?: number;

  @Column({ name: 'FECHTANQUEO', type: 'datetime2' })
  fechaTanqueo: Date;

  @Column(() => CoordenadasEmbeddable, { prefix: 'UBIC' })
  ubicacion?: CoordenadasEmbeddable;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 1000, nullable: true })
  observaciones?: string;

  @Column({
    name: 'ESTADO',
    type: 'nvarchar',
    length: 20,
    default: EstadoTanqueo.REGISTRADO,
  })
  estado: EstadoTanqueo;

  @Column({
    name: 'EVIDENCIAS',
    type: 'nvarchar',
    length: 'MAX',
    nullable: true,
    default: () => "'{}'",
    transformer: evidenciasTanqueoTransformer,
  })
  evidencias?: EvidenciasTanqueo;

  @Column({ name: 'EVIDCOMPLETAS', type: 'bit', default: false })
  evidenciasCompletas: boolean;

  @Column(() => OrigenRegistroEmbeddable, { prefix: 'ORIG' })
  origenRegistro?: OrigenRegistroEmbeddable;

  @ManyToOne(() => UsuarioOrm, { nullable: true })
  @JoinColumn({ name: 'DECIDIDOPOROID' })
  decididoPorUsuario?: UsuarioOrm;

  @Column({ name: 'FECHADECISION', type: 'datetime2', nullable: true })
  fechaDecision?: Date;

  @Column({ name: 'MOTIVODECISION', type: 'nvarchar', length: 500, nullable: true })
  motivoDecision?: string;

  @Column({ name: 'APROBCONOVERRIDE', type: 'bit', default: false })
  aprobacionConOverride: boolean;

  @OneToMany(() => TanqueoInconsistenciaOrm, inconsistencia => inconsistencia.tanqueo)
  inconsistencias: TanqueoInconsistenciaOrm[];
}

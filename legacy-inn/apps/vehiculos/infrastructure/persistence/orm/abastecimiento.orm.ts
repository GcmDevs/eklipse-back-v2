import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { UsuarioOrm } from '@orm/gen';
import { TipoCombustible, UnidadMedidaCombustible } from '@vehiculos/domain/enums';
import { EvidenciasTanqueo } from '@vehiculos/domain/value-objects';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, Unique } from 'typeorm';
import { CoordenadasEmbeddable, evidenciasTanqueoTransformer } from './supports';
import { RepositorioCombustibleOrm } from './repositorio-combustible.orm';
import { TanqueoOrm } from './tanqueo.orm';

@Entity({ name: 'GCNABASTECIMIENTOS' })
@Unique('UQ_GCNABASTECIMIENTOS_CODIGO', ['codigo'])
@Index('UQ_GCNABASTECIMIENTOS_TANQUEO', ['tanqueo'], {
  unique: true,
  where: '[TANQUEOOID] IS NOT NULL',
})
export class AbastecimientoOrm extends BaseTimestampedOrm {
  @Column({ name: 'CODIGO', type: 'nvarchar', length: 20 })
  codigo: string;

  @Column({ name: 'CLIENTEUUID', type: 'nvarchar', length: 36, nullable: true })
  clienteUuid?: string;

  @Column({ name: 'ESTACIONOID', type: 'int' })
  estacionServicioId: number;

  @ManyToOne(() => UsuarioOrm, { nullable: false })
  @JoinColumn({ name: 'USUARIOOID' })
  usuario: UsuarioOrm;

  @Column({ name: 'VALORPAGADO', type: 'decimal', precision: 12, scale: 2 })
  valorTotalPagado: number;

  @Column({ name: 'CANTCOMBUST', type: 'decimal', precision: 8, scale: 2, nullable: true })
  cantidadCombustible?: number;

  @Column({
    name: 'UNIDADMEDCANTCOMBUST',
    enum: UnidadMedidaCombustible,
    type: 'nvarchar',
    length: 3,
    nullable: true,
  })
  unidadMedidaCombustible?: UnidadMedidaCombustible;

  @Column({ name: 'TIPOCOMBUST', enum: TipoCombustible, type: 'nvarchar', length: 9 })
  tipoCombustible: TipoCombustible;

  @Column({ name: 'FECHABASTEC', type: 'datetime2' })
  fechaAbastecimiento: Date;

  @Column(() => CoordenadasEmbeddable, { prefix: 'UBIC' })
  ubicacion?: CoordenadasEmbeddable;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 1000, nullable: true })
  observaciones?: string;

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

  @OneToOne(() => TanqueoOrm, { nullable: true })
  @JoinColumn({ name: 'TANQUEOOID' })
  tanqueo?: TanqueoOrm;

  @ManyToOne(() => RepositorioCombustibleOrm, { nullable: true })
  @JoinColumn({ name: 'REPOSITORIOOID' })
  repositorio?: RepositorioCombustibleOrm;
}

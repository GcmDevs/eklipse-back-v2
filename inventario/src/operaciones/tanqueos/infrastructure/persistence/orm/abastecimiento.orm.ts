import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { EstadoAbastecimiento } from '@inn/operaciones/tanqueos/domain/enums/estados.enum';
import { UsuarioOrm } from '@inn/orm/gen';
import { TipoCombustible, UnidadMedidaCombustible } from '@inn/operaciones/tanqueos/domain/enums';
import { EvidenciasTanqueo } from '@inn/operaciones/tanqueos/domain/value-objects';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, Unique } from 'typeorm';
import { CoordenadasEmbeddable, evidenciasTanqueoTransformer } from './supports';
import { RepositorioCombustibleOrm } from './repositorio-combustible.orm';
import { TanqueoOrm } from './tanqueo.orm';

@Entity({ name: TABLE_NAMES.inn.ges_tanqueos.abastecimientos })
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

  @Column({ name: 'CANTCOMBUST', type: 'decimal', precision: 9, scale: 3, nullable: true })
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

  @Column({ name: 'ESTADO', type: 'nvarchar', length: 10, default: EstadoAbastecimiento.ACTIVO })
  estado: EstadoAbastecimiento;

  @ManyToOne(() => UsuarioOrm, { nullable: true })
  @JoinColumn({ name: 'ANULADOPOROID' })
  anuladoPor?: UsuarioOrm;

  @Column({ name: 'FECHAANULACION', type: 'datetime2', nullable: true })
  fechaAnulacion?: Date;

  @Column({ name: 'MOTIVOANULACION', type: 'nvarchar', length: 500, nullable: true })
  motivoAnulacion?: string;

  @OneToOne(() => TanqueoOrm, { nullable: true })
  @JoinColumn({ name: 'TANQUEOOID' })
  tanqueo?: TanqueoOrm;

  @ManyToOne(() => RepositorioCombustibleOrm, { nullable: true })
  @JoinColumn({ name: 'REPOSITORIOOID' })
  repositorio?: RepositorioCombustibleOrm;
}

import { BaseCreatedOrm } from '@common/infrastructure/orm';
import { UsuarioOrm } from '@orm/gen';
import { TipoMovimientoCombustible } from '@vehiculos/domain/enums';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbastecimientoOrm } from './abastecimiento.orm';
import { RepositorioCombustibleOrm } from './repositorio-combustible.orm';
import { TanqueoOrm } from './tanqueo.orm';

@Entity({ name: 'GCNMOVIMIENTOSCOMB' })
export class MovimientoCombustibleOrm extends BaseCreatedOrm {
  @ManyToOne(() => RepositorioCombustibleOrm, repo => repo.movimientos, { nullable: false })
  @JoinColumn({ name: 'REPOSITORIOOID' })
  repositorio: RepositorioCombustibleOrm;

  @Column({
    name: 'TIPO',
    enum: TipoMovimientoCombustible,
    type: 'nvarchar',
    length: 10,
  })
  tipo: TipoMovimientoCombustible;

  @Column({ name: 'CANTIDAD', type: 'decimal', precision: 12, scale: 2 })
  cantidad: number;

  @Column({ name: 'STOCKRESULT', type: 'decimal', precision: 12, scale: 2 })
  stockResultante: number;

  @ManyToOne(() => UsuarioOrm, { nullable: false })
  @JoinColumn({ name: 'USUARIOOID' })
  usuario: UsuarioOrm;

  @ManyToOne(() => TanqueoOrm, { nullable: true })
  @JoinColumn({ name: 'TANQUEOOID' })
  tanqueo?: TanqueoOrm;

  @ManyToOne(() => AbastecimientoOrm, { nullable: true })
  @JoinColumn({ name: 'ABASTECIMIENTOOID' })
  abastecimiento?: AbastecimientoOrm;
}

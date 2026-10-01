import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { TipoCombustible, UnidadMedidaCombustible } from '@vehiculos/domain/enums';
import { Column, Entity, OneToMany } from 'typeorm';
import { MovimientoCombustibleOrm } from './movimiento-combustible.orm';

@Entity({ name: 'GCNREPOSITORIOSCOMB' })
export class RepositorioCombustibleOrm extends BaseTimestampedOrm {
  @Column({ name: 'NOMBRE', type: 'nvarchar', length: 150 })
  nombre: string;

  @Column({ name: 'TIPOCOMBUST', enum: TipoCombustible, type: 'nvarchar', length: 9 })
  tipoCombustible: TipoCombustible;

  @Column({
    name: 'UNIDADMED',
    enum: UnidadMedidaCombustible,
    type: 'nvarchar',
    length: 3,
  })
  unidadMedida: UnidadMedidaCombustible;

  @Column({ name: 'CAPACIDAD', type: 'decimal', precision: 12, scale: 2 })
  capacidad: number;

  @Column({ name: 'STOCKACTUAL', type: 'decimal', precision: 12, scale: 2, default: 0 })
  stockActual: number;

  @Column({ name: 'ACTIVO', type: 'bit', default: true })
  activo: boolean;

  @OneToMany(() => MovimientoCombustibleOrm, mov => mov.repositorio)
  movimientos?: MovimientoCombustibleOrm[];
}

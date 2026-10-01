import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { ModeloOrm } from '@orm/inn/equipos';
import {
  ClasificacionUso,
  EstadoVehiculo,
  TipoActivo,
  TipoCombustible,
  UnidadMedidaCombustible,
} from '@vehiculos/domain/enums';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'EKINNDEVEHICULOS' })
export class VehiculoOrm extends BaseTimestampedOrm {
  @Column({ name: 'PLACA' })
  placa: string;

  @ManyToOne(() => ModeloOrm)
  @JoinColumn({ name: 'MODELOOID' })
  modelo: ModeloOrm;

  @Column({
    name: 'ESTADO',
    type: 'nvarchar',
    length: 20,
    default: EstadoVehiculo.ACTIVA,
  })
  estado: EstadoVehiculo;

  @Column({
    name: 'TIPOACTIVO',
    enum: TipoActivo,
    type: 'nvarchar',
    length: 10,
    default: TipoActivo.VEHICULO,
  })
  tipoActivo: TipoActivo;

  @Column({ name: 'TIPOCOMBUST', enum: TipoCombustible, type: 'nvarchar', length: 9 })
  tipoCombustible: TipoCombustible;

  @Column({ name: 'CAPACIDADALMCOMBUST', type: 'decimal', precision: 8, scale: 2, nullable: true })
  capacidadAlmacenamientoCombustible?: number;

  @Column({
    name: 'CAPACIDADUNIDADMEDCOMBUST',
    enum: UnidadMedidaCombustible,
    type: 'nvarchar',
    length: 3,
    nullable: true,
  })
  unidadMedidaCapacidad: UnidadMedidaCombustible;

  @Column({ name: 'ANIOMODELO', type: 'smallint', nullable: true })
  anioModelo?: number;

  @Column({
    name: 'CLASIFUSO',
    enum: ClasificacionUso,
    type: 'nvarchar',
    length: 20,
    nullable: true,
  })
  clasificacionUso?: ClasificacionUso;

  @Column({ name: 'ULTKILOMETRAJEACT', type: 'int', nullable: true })
  kilometrajeActual?: number;

  @Column({ name: 'DELETED', type: 'bit', default: false })
  deleted: boolean;
}

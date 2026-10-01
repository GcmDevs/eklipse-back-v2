import { TABLE_NAMES } from '@common/application/constants';
import { UsuarioOrm } from '@sln/orm/gen';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RolFacturadorOrm } from './rol-facturador';
import { DetalleFacturadoresOrm } from './detalle-facturadores';

@Entity(TABLE_NAMES.sln.ctegr.facturadores)
export class FacturadoresOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'USUARIOID' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'USUARIOID', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @ManyToOne(() => RolFacturadorOrm)
  @JoinColumn([{ name: 'ROLFACTURADOR', referencedColumnName: 'id' }])
  rol: RolFacturadorOrm;

  @Column({ name: 'ROLFACTURADOR' })
  rolId: number;

  @Column({ name: 'ACTIVO' })
  estado: boolean;

  @Column({ name: 'FECHACREACION' })
  fechaCreacion: Date;

  @Column({ name: 'FECHACAMBIOESTADO' })
  fechaCambioEstado: Date;

  @Column({ name: 'DETALLE' })
  detalleId: number;

  @ManyToOne(() => DetalleFacturadoresOrm)
  @JoinColumn([{ name: 'DETALLE', referencedColumnName: 'id' }])
  detalle: DetalleFacturadoresOrm;
}

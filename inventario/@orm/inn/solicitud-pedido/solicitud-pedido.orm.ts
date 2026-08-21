import {
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Entity,
  Index,
} from 'typeorm';

import { GcmContextType } from '@common/domain/types';
import { SolicitudPedidoHistorialOrm } from './solicitud-pedido-historial.orm';
import { UsuarioOrm } from '@inn/orm/gen';
import { CentroOrm } from '@inn/orm/adn';
import { EstadoSolicitudPedidoCode } from '@inn/types/inn/solicitud-pedido';
import { SolicitudPedidoProductoOrm } from './solicitud-pedido-producto.orm';

@Entity('EKINNSOLPE')
export class SolicitudPedidoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ESTADO' })
  estadoCode: EstadoSolicitudPedidoCode;

  @ManyToOne(() => CentroOrm)
  @JoinColumn([{ name: 'SEDE', referencedColumnName: 'id' }])
  sede: CentroOrm;

  @Column({ name: 'SEDE' })
  sedeId: number;

  @Column({ name: 'FECHACREAC' })
  fechaCreacion: Date;

  @Index('UX_EKINNSOLPE_NUMEROSOLICITUD', { unique: true })
  @Column({ name: 'NUMEROSOLICITUD' })
  numeroSolicitud: string;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO1', referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;

  @Column({ name: 'GENUSUARIO1' })
  creadoPorId: number;

  @Column({ name: 'HASVISTO' })
  hasVisto: boolean;

  @Column({ name: 'OBSERVACIONRECHAZO' })
  obervacionRechazo: string;

  @OneToMany(() => SolicitudPedidoHistorialOrm, historial => historial.solicitudPedido)
  historial: SolicitudPedidoHistorialOrm[];

  @OneToMany(() => SolicitudPedidoProductoOrm, producto => producto.solicitudPedido)
  productos: SolicitudPedidoProductoOrm[];

  context: GcmContextType;
}

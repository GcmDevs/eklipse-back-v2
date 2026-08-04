import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CotizacionPrefabricadaItemOrm } from './cotizacion-prefabricada-item.orm';
import { ProveedorOrm, UsuarioOrm } from '@inn/orm/gen';
import { DocumentoOrm } from '../documentos';

@Entity('EKINNCTCPFB')
export class CotizacionPrefabricadaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GENTERCERP' })
  proveedorId: number;

  @ManyToOne(() => ProveedorOrm)
  @JoinColumn([{ name: 'GENTERCERP', referencedColumnName: 'id' }])
  proveedor: ProveedorOrm;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'INNDOCUME' })
  documentoId: number;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'INNDOCUME', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @OneToMany(() => CotizacionPrefabricadaItemOrm, detalle => detalle.cotizacionPrefabricada)
  detalle: CotizacionPrefabricadaItemOrm[];

  @Column({ name: 'CREATEDAT' })
  createdAt: Date;
}

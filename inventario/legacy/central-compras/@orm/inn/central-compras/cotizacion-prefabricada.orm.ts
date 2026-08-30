import { ProveedorOrm, UsuarioOrm } from '@inn/lgc/ctc/orm/gen';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CotizacionPrefabricadaItemOrm } from './cotizacion-prefabricada-item.orm';
import { DocumentoOrm } from '@inn/lgc/ctc/orm/inn/documentos';

@Entity('EKINNCTCPFB')
export class CotizacionPrefabricadaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => ProveedorOrm)
  @JoinColumn([{ name: 'GENTERCERP', referencedColumnName: 'id' }])
  proveedor: ProveedorOrm;

  @Column({ name: 'GENTERCERP' })
  proveedorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'INNDOCUME', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @Column({ name: 'INNDOCUME' })
  documentoId: number;

  @Column({ name: 'CREATEDAT' })
  createdAt: Date;

  @OneToMany(() => CotizacionPrefabricadaItemOrm, detalle => detalle.cotizacionPrefabricada)
  detalle: CotizacionPrefabricadaItemOrm[];
}

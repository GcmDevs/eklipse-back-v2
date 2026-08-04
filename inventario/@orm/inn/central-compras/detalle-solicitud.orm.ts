import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TipoCode, TipoType, tipoTypeFactory } from '@inn/types/inn/central-compras/solicitudes';
import { ProductoOrm as AfnProductoOrm } from '@inn/orm/inn/activos-fijos';
import { SolicitudOrm } from './solicitud.orm';
import { ProductoOrm } from '../productos';

@Entity('EKINNCTCSOLITEM')
export class DetalleSolicitudOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'EKINNCTCSOLI' })
  solicitudId: number;

  @ManyToOne(() => SolicitudOrm, solicitud => solicitud.detalle)
  @JoinColumn({ name: 'EKINNCTCSOLI' })
  solicitud: SolicitudOrm;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: 'CANTIDAD', type: 'decimal', precision: 7, scale: 2 })
  cantidad: number;

  @Column({ name: 'MARCA' })
  marca: string;

  @Column({ name: 'FTARCHIVO' })
  fichaTecnica: string;

  @Column({ name: 'FIARCHIVO' })
  formatoInclusion: string;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'DESCRIPCION' })
  descripcion: string;

  @Column({ name: 'TIPO' })
  tipoCode: TipoCode;

  @Column({ name: 'ISDELETED' })
  isDeleted: boolean;

  tipo: TipoType;
  informacionAdicional: string;
  productoStored: ProductoOrm | AfnProductoOrm;

  addProductosStoredToProductoForOldVersion() {
    this.producto = this.productoStored as any;
  }

  setTypes(removeTypeCodes?: boolean) {
    this.tipo = tipoTypeFactory(this.tipoCode);

    if (removeTypeCodes) {
      delete this.tipoCode;
    }
  }
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SolicitudOrm } from './solicitud.orm';
import {
  TipoCode,
  TipoType,
  tipoTypeFactory,
} from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { ProductoOrm as AfnProductoOrm } from '@inn/lgc/ctc/orm/inn/activos-fijos';
import { ProductoOrm } from '@inn/lgc/ctc/orm/inn/productos';

@Entity('EKINNCTCSOLITEM')
export class DetalleSolicitudOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => SolicitudOrm, solicitud => solicitud.detalle)
  @JoinColumn({ name: 'EKINNCTCSOLI' })
  solicitud: SolicitudOrm;

  @Column({ name: 'EKINNCTCSOLI' })
  solicitudId: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

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

import { AgrupamientoProductoOrm, DocumentoOrm, ProductoOrm } from '@inn/orm/inn';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import {
  MotivoDevolucionSumPacCode,
  MotivoDevolucionSumPacType,
  motivoDevolucionSumPacTypeFactory,
} from '@inn/docs/sumpac/domain/types';
import { CustomDevolucionOrm } from './devolucion.orm';

@Entity('EKINNSUMDEVCTMDET')
export class CustomDevolucionDetalleOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;
  temporalId: number;

  @ManyToOne(() => CustomDevolucionOrm, devolucion => devolucion.detalle)
  @JoinColumn({ name: 'EKINNSUMDEVCTM', referencedColumnName: 'id' })
  devolucion: CustomDevolucionOrm;

  @Column({ name: 'EKINNSUMDEVCTM' })
  devolucionId: number;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  producto: ProductoOrm | AgrupamientoProductoOrm;

  @Column({ name: 'NOMBRE' })
  nombreCustom: string;

  codigo: string;
  nombre: string;

  @Column({ name: 'CANTIDAD' })
  cantidad: number;

  @Column({ name: 'LOTE' })
  lote: string;

  @Column({ name: 'MOTIDEVOLU' })
  motivoCode: MotivoDevolucionSumPacCode;

  motivo: MotivoDevolucionSumPacType;

  @Column({ name: 'ESTADO' })
  estadoCode: 1 | 2 | 3;

  setNombre(removeRealData?: boolean) {
    if (this.nombreCustom) this.nombre = this.nombreCustom;
    if (this.producto) {
      if ((this.producto as ProductoOrm).descripcion) {
        this.nombre = (this.producto as ProductoOrm).descripcion;
      } else {
        this.nombre = this.producto.nombre;
      }
    }

    if (removeRealData) {
      delete this.producto;
      delete this.productoId;
      delete this.nombreCustom;
    }
  }

  setTypes(removeTypeCodes?: boolean) {
    this.motivo = motivoDevolucionSumPacTypeFactory(this.motivoCode);

    if (removeTypeCodes) {
      delete this.motivoCode;
    }
  }
}

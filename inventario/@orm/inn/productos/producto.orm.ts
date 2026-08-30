import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ClaseProductoCode, ClaseProductoType, TipoProductoCode } from '@inn/types/inn/productos';

@Entity('INNPRODUC')
export class ProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IPRCODIGO' })
  codigo: string;

  @Column({ name: 'IPRCLAPRO' })
  claseCode: ClaseProductoCode;

  @Column({ name: 'IPRTIPPRO' })
  tipoCode: TipoProductoCode;

  @Column({ name: 'IPRDESCOR' })
  descripcionCorta: string;

  @Column({ name: 'IPRDESLAR' })
  descripcionLarga: string;

  @Column({ name: 'IPRBLOQUEO' })
  isBloqueado: boolean;

  @Column({ name: 'IPRMARDISP' })
  marca: string;

  @Column({ name: 'IPRCUM' })
  CUM: string;

  @Column({ name: 'IPRCOSTPE', type: 'decimal', precision: 4 })
  precioSugerido: number;

  clase: ClaseProductoType;
  descripcion: string;
}

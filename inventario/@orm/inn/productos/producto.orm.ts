import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AgrupamientoOrm } from './inn/agrupamiento.orm';
import { ClaseProductoCode, ClaseProductoType, TipoProductoCode } from '@inn/types/inn/productos';

@Entity('INNPRODUC')
export class ProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'INNAGRUPAMI', nullable: true })
  agrupamientoId: number | null;

  @ManyToOne(() => AgrupamientoOrm)
  @JoinColumn({ name: 'INNAGRUPAMI' })
  agrupamiento: AgrupamientoOrm;

  @Column({ name: 'IPRCODIGO' })
  codigo: string;

  @Column({ name: 'IPRCLAPRO' })
  claseCode: ClaseProductoCode;

  @Column({ name: 'IPRTIPPRO' })
  tipoCode: TipoProductoCode;

  @Column({ name: 'ISGCODIGO', type: 'int', nullable: true })
  codigoSub: number | null;

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

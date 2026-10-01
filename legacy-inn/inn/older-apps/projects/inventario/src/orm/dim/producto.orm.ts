import { ClaseProductoTypeCode } from '@inn/old/inn/recepcion-tecnica/domain/types';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('INNPRODUC')
export class InnProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IPRCLAPRO' })
  clase: ClaseProductoTypeCode;

  @Column({ name: 'IPRTIPPRO' })
  tipo: ClaseProductoTypeCode;

  @Column({ name: 'IPRCODIGO', length: 20 })
  codigo: string;

  @Column({ name: 'IPRDESCOR', length: 300 })
  descripcion: string;

  @Column({ name: 'IPRMARDISP' })
  marca?: string;

  @Column({ name: 'IPRBLOQUEO' })
  isBloqueado: boolean;

  @Column({ name: 'IPRCOSTPE' })
  precioSugerido: number;

  centroId?: number;
}

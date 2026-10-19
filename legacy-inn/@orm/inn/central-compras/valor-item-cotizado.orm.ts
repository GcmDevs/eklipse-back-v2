import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('EKINNCTCPFBITEMVAL')
export class ValorItemCotizadoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'VALOR', type: 'decimal', precision: 4 })
  valor: number;

  @Column({ name: 'IVA', type: 'money', scale: 4 })
  IVA: number;

  @Column({ name: 'EKINNCTCPFBITEM' })
  itemCotizadoId: number;

  @Column({ name: 'CREATEDBY' })
  createdById: number;

  @Column({ name: 'CREATEDAT' })
  createdAt: Date;
}

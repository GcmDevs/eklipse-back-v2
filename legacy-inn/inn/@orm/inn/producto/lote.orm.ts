import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('INNLOTSER')
export class LoteProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ILSCODIGO' })
  codigo: string;

  @Column({ name: 'ILSFECVEN' })
  fechaVencimiento: Date;
}

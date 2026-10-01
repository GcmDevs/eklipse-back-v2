import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('INNALMACE')
export class AlmacenOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IALCODIGO' })
  codigo: string;

  @Column({ name: 'IALPREFIJ' })
  prefijo: string;
}

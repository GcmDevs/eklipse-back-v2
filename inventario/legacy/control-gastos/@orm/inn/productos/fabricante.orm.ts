import { TABLE_NAMES } from '@common/application/constants';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity(TABLE_NAMES.inn.pdt.fabricantes)
export class FabricanteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IFRCODIGO' })
  codigo: string;

  @Column({ name: 'IFRNOMBRE' })
  nombre: string;
}

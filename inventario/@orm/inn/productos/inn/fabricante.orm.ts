import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('INNFABRIC')
export class FabricanteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IFRCODIGO' })
  codigo: string;

  @Column({ name: 'IFRNOMBRE' })
  nombre: string;
}

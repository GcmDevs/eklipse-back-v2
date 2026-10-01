import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('EKGENSERIPS')
export class EkServicioIpsOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CODIGO' })
  codigo: string;

  @Column({ name: 'NOMBRE' })
  nombre: string;
}

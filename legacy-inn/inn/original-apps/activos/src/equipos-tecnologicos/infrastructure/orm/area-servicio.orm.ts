import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { RSAServices } from '@common/application/services';

@Entity('AFNAREAS')
export class AreaServicioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ARECODIGO' })
  codigo: string;

  @Column({ name: 'ARENOMBRE' })
  nombre: string;

  encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }

  decryptId() {
    this.id = RSAServices.decryptId(this.id as any);
  }
}

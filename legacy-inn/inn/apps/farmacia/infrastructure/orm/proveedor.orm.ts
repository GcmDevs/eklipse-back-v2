import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { RSAServices } from '@common/application/services';

@Entity('GENTERCERP')
export class ProveedorOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GPRCODIGO' })
  codigo: string;

  @Column({ name: 'GPRNOMBRE' })
  nombre: string;

  encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }

  decryptId() {
    this.id = RSAServices.decryptId(this.id as any);
  }
}

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { RSAServices } from '@common/application/services';
import { RolDependienteType } from '@inn/ek-types/gen/dependencias';

@Entity({ name: 'AFNDEPART', synchronize: false })
export class DependenciaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'DEPCODIGO' })
  codigo: string;

  @Column({ name: 'DEPNOMBRE' })
  nombre: string;

  encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }

  decryptId() {
    this.id = RSAServices.decryptId(this.id as any);
  }

  rol?: RolDependienteType;
}

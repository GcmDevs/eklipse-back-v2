import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { RSAServices } from '@common/application/services';
import { EstadoUsuarioCode } from '@gtypes/gen/usuarios';

@Entity('EKINNOFERPROVEEDOR')
export class AuthProveedorOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ESTADO' })
  statusCode: EstadoUsuarioCode;

  @Column({ name: 'TERNUMDOC' })
  document: string;

  @Column({ name: 'NOMBRE_TERCERO' })
  fullName: string;

  @Column({ name: 'EMAIL1' })
  email1: string;

  @Column({ name: 'EMAIL2' })
  email2: string;

  @Column({ name: 'EMAIL3' })
  email3: string;

  @Column({ name: 'PASSWORD' })
  password: string;

  passUncripted: string;

  // Custom variables & functions
  public encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }

  public decryptId() {
    this.id = RSAServices.decryptId(this.id as any);
  }
}

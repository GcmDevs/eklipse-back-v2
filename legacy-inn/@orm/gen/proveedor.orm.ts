import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { TerceroOrm } from './tercero.orm';
import { RSAServices } from '@common/application/services';

@Entity({ name: TABLE_NAMES.gen.proveedores, synchronize: false })
export class ProveedorOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GPRCODIGO' })
  codigo: string;

  @Column({ name: 'GPRNOMBRE' })
  nombre: string;

  @OneToOne(() => TerceroOrm)
  @JoinColumn({ name: TABLE_NAMES.gen.terceros, referencedColumnName: 'id' })
  tercero: TerceroOrm;

  @Column({ name: TABLE_NAMES.gen.terceros })
  terceroId: number;

  @Column({ name: 'GPRDIRECC' })
  direccion: string;

  @Column({ name: 'GPRTELEFO1' })
  tel1: string;

  @Column({ name: 'GPRTELEFO2' })
  tel2: string;

  encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }

  decryptId() {
    this.id = RSAServices.decryptId(this.id as any);
  }
}

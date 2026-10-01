import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { _PrivSecUserOrm } from '@common/infrastructure/orm/user.orm';
import { RSAServices } from '@common/application/services';

@Entity('EKGENLASTAUTH')
export class LastAuthOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @OneToOne(() => _PrivSecUserOrm)
  @JoinColumn({ name: 'GENUSUARIO' })
  user: _PrivSecUserOrm;

  @Column({ name: 'FROMWEB' })
  timesFromWeb: number;

  @Column({ name: 'FROMMOVIL' })
  timesFromMobile: number;

  @Column({ name: 'FECHLTAUTWEB' })
  lastAuthOnWeb: Date;

  @Column({ name: 'FECHLTAUTMOV' })
  lastAuthOnMobile: Date;

  // Custom variables & functions
  public encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }

  public decryptId() {
    this.id = RSAServices.decryptId(this.id as any);
  }
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { HpnIngresoOrm } from './hpn-ingreso.orm';
import { MunicipioOrm } from '@hpn/lgc/aud/orm/gen';

@Entity('ADNEGRESO')
export class EgresoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ADENUMEGR' })
  consecutivo: number;

  @OneToOne(() => HpnIngresoOrm)
  @JoinColumn([{ name: 'ADNINGRESO', referencedColumnName: 'id' }])
  ingreso: HpnIngresoOrm;

  @Column({ name: 'ADNINGRESO' })
  ingresoId: number;

  @Column({ name: 'HCECONSEC' })
  consecutivoEpicrisis: number;

  @ManyToOne(() => MunicipioOrm)
  @JoinColumn([{ name: 'GENMUNICI', referencedColumnName: 'id' }])
  municipio: MunicipioOrm;

  @Column({ name: 'ADEFECSAL' })
  fechaSalida: Date;
}

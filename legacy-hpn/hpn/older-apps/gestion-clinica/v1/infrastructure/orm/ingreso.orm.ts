import { CamaOrm } from '@hpn/old/orm/cama.orm';
import { DetalleContratoOrm } from '@hpn/old/orm/general';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('ADNINGRESO')
export class IngresoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'AINCONSEC' })
  consecutive: number;

  @Column({ name: 'HPNDEFCAM' })
  camaId: number;

  @ManyToOne(() => CamaOrm)
  @JoinColumn({ name: 'HPNDEFCAM', referencedColumnName: 'id' })
  cama: CamaOrm;

  @Column({ name: 'GENDETCON' })
  contratoId: number;

  @Column({ name: 'ADNCENATE' })
  centroId: number;

  @ManyToOne(() => DetalleContratoOrm)
  @JoinColumn({ name: 'GENDETCON', referencedColumnName: 'id' })
  contrato: DetalleContratoOrm;
}

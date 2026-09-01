import { Entity, Column, OneToMany, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { CamaOrm } from './cama.orm';
import { EstanciaOrm } from './estancia.orm';
import { DiagnosticoOrm } from './diagnostico.orm';
import { EgresoOrm } from './egreso.orm';
import { IngresoOrm } from '@hpn/lgc/tas/orm/gen';

@Entity('ADNINGRESO')
export class HpnIngresoOrm extends IngresoOrm {
  @Column({ name: 'AINFECEGRE' })
  fechaEgreso: Date;

  @OneToMany(() => CamaOrm, cama => cama.ingreso)
  camas: CamaOrm[];

  @OneToMany(() => EstanciaOrm, cama => cama.ingreso)
  estancias: EstanciaOrm[];

  @ManyToOne(() => DiagnosticoOrm, diagnostico => diagnostico.ingresos)
  @JoinColumn([{ name: 'DGNDIAGNO', referencedColumnName: 'id' }])
  diagnostico: DiagnosticoOrm;

  @OneToOne(() => EgresoOrm)
  @JoinColumn([{ name: 'ADNEGRESO', referencedColumnName: 'id' }])
  egreso: EgresoOrm;

  @Column({ name: 'ADNEGRESO' })
  egresoId: Date;

  estanciaActual: EstanciaOrm;
}

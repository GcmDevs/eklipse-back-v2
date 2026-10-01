import { Entity, OneToMany } from 'typeorm';
import { HpnIngresoOrm } from './hpn-ingreso.orm';
import { PacienteOrm } from './general';

@Entity('GENPACIEN')
export class HpnPacienteOrm extends PacienteOrm {
  @OneToMany(() => HpnIngresoOrm, ingreso => ingreso.paciente)
  ingresos: HpnIngresoOrm[];
  ingresoActual: HpnIngresoOrm;
}

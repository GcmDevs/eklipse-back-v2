import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { PacienteOrm } from './paciente.orm';
import { CtmType } from '@common/domain/types';
import { DetalleContratoOrm } from '../terceros';
import { TipoIngresoCode, tipoIngresoFactory } from '@hpn/lgc/aud/types/gen';
import {
  FormaIngresoCode,
  CausaIngresoCode,
  formaIngresoFactory,
  causaIngresoFactory,
} from '@hpn/lgc/aud/types/temp';
import { EspecialidadOrm } from '@hpn/lgc/aud/orm/temp/especialidad.orm';
import { CamaOrm } from '@orm/hpn';

@Entity('ADNINGRESO')
export class IngresoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'AINCONSEC' })
  consecutivo: string;

  @Column({ name: 'AINURGCON' })
  formaCode: FormaIngresoCode;

  @Column({ name: 'AINCAUING' })
  causaCode: CausaIngresoCode;

  @ManyToOne(() => PacienteOrm)
  @JoinColumn([{ name: 'GENPACIEN', referencedColumnName: 'id' }])
  paciente: PacienteOrm;

  @Column({ name: 'GENPACIEN' })
  pacienteId: number;

  @Column({ name: 'AINTIPING' })
  claseCode: TipoIngresoCode;

  @ManyToOne(() => DetalleContratoOrm)
  @JoinColumn([{ name: 'GENDETCON', referencedColumnName: 'id' }])
  detalleContrato: DetalleContratoOrm;

  @Column({ name: 'GENDETCON' })
  detalleContratoId: number;

  @Column({ name: 'AINFECING' })
  fechaIngreso: Date;

  @Column({ name: 'AINFECEGRE' })
  fechaEgreso: Date;

  /* ESTAS RELACIONES FUERON AGREGADAS RECIENTEMENTE POR JESUS */
  @ManyToOne(() => EspecialidadOrm, esp => esp.ingresos)
  @JoinColumn([{ name: 'GENESPECI', referencedColumnName: 'id' }])
  especialidad: EspecialidadOrm;

  @Column({ name: 'HPNDEFCAM' })
  camaId: number;

  @ManyToOne(() => CamaOrm)
  @JoinColumn({ name: 'HPNDEFCAM', referencedColumnName: 'id' })
  cama: CamaOrm;

  /*   @OneToMany(() => SolicitudExamenOrm, servicio => servicio.ingreso)
  examenes: SolicitudExamenOrm[]; */

  clase: CtmType<TipoIngresoCode>;
  forma: CtmType<FormaIngresoCode>;
  causa: CtmType<CausaIngresoCode>;

  setTypes(removeTypeCodes?: boolean) {
    this.clase = tipoIngresoFactory(this.claseCode);
    this.forma = formaIngresoFactory(this.formaCode);
    this.causa = causaIngresoFactory(this.causaCode);

    if (removeTypeCodes) {
      delete this.claseCode;
      delete this.formaCode;
      delete this.causaCode;
    }
  }
}

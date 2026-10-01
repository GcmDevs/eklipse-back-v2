import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PacienteOrm } from './paciente.orm';
import { CtmType } from '@common/domain/types';
import { DetalleContratoOrm } from '../terceros';

import { TipoIngresoCode, tipoIngresoFactory } from '@hpn/old/types/general';
import { FormaIngresoCode, formaIngresoFactory } from '@hpn/old/types/forma-ingreso';
import { CausaIngresoCode, causaIngresoFactory } from '@hpn/old/types/causa-ingreso';

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

  get originalColumnName() {
    return 'ADNINGRESO';
  }
}

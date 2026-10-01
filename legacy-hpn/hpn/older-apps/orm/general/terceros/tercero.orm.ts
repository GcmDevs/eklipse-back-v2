import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { MunicipioOrm } from '../ubicacion';
import {
  NacionalidadCode,
  TipoContribuyenteCode,
  TipoPersonaCode,
  TipoRetencionCode,
  nacionalidadTypeFactory,
  tipoContribuyenteTypeFactory,
  tipoPersonaTypeFactory,
  tipoRetencionTypeFactory,
} from '@hpn/old/types/general';
import { CtmType } from '@common/domain/types';

@Entity('GENTERCER')
export class TerceroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TERNUMDOC', length: 20 })
  numeroDocumento: string;

  @Column({ name: 'TERDIGITO', length: 1, nullable: true })
  digitoVerifiDocumento: string;

  @Column({ name: 'TERTIPDOC' })
  tipoDocumento: number;

  @Column({ name: 'TEREXPEDI', length: 60 })
  lugarExpediDocumento: string;

  @Column({ name: 'TERPRINOM', length: 200 })
  primerNombre: string;

  @Column({ name: 'TERSEGNOM', length: 30, nullable: true })
  segundoNombre: string;

  @Column({ name: 'TERPRIAPE', length: 30, nullable: true })
  primerApellido: string;

  @Column({ name: 'TERSEGAPE', length: 30, nullable: true })
  segundoApellido: string;

  @ManyToOne(() => MunicipioOrm)
  @JoinColumn([{ name: 'DGNMUNICIPIO', referencedColumnName: 'id' }])
  municipio: MunicipioOrm;

  @Column({ name: 'TERNACION' })
  nacionalidadCode: NacionalidadCode;

  @Column({ name: 'TERTIPPER' })
  tipoPersonaCode: TipoPersonaCode;

  @Column({ name: 'TERTIPRET' })
  tipoRetencionCode: TipoRetencionCode;

  @Column({ name: 'TERTIPCON' })
  tipoContribuyenteCode: TipoContribuyenteCode;

  nacionalidad: CtmType<NacionalidadCode>;
  tipoPersona: CtmType<TipoPersonaCode>;
  tipoRetencion: CtmType<TipoRetencionCode>;
  tipoContribuyente: CtmType<TipoContribuyenteCode>;

  setTypes(removeTypeCodes?: boolean) {
    this.nacionalidad = nacionalidadTypeFactory(this.nacionalidadCode);
    this.tipoPersona = tipoPersonaTypeFactory(this.tipoPersonaCode);
    this.tipoRetencion = tipoRetencionTypeFactory(this.tipoRetencionCode);
    this.tipoContribuyente = tipoContribuyenteTypeFactory(this.tipoContribuyenteCode);

    if (removeTypeCodes) {
      delete this.nacionalidadCode;
      delete this.tipoPersonaCode;
      delete this.tipoRetencionCode;
      delete this.tipoContribuyenteCode;
    }
  }

  get originalColumnName() {
    return 'GENTERCER';
  }
}

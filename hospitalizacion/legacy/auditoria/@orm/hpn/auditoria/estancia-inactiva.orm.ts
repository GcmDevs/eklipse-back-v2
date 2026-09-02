import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { AuditoriaOrm } from './auditoria.orm';
import {
  agruEstanProlErpTypeFactory,
  agruEstanProlIpsTypeFactory,
  AgruEstanProloErpCode,
  AgruEstanProloErpType,
  AgruEstanProloIpsCode,
  AgruEstanProloIpsType,
  EstanciaProlongadaErpUsuarioCode,
  EstanciaProlongadaIpsCode,
} from '@hpn/lgc/aud/types/hpn/auditoria';
import { EspecialidadOrm } from '@hpn/lgc/aud/orm/gen/medicos';

@Entity(TABLE_NAMES.hpn.auditoria.estanciasInactivas)
export class EstanciaInactivaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'INICIO' })
  inicio: Date;

  @Column({ name: 'FINAL' })
  fin: Date;

  @Column({ name: 'AGRUESTPROERPUSU' })
  agruEstanProlonErpUsuCode: AgruEstanProloErpCode;

  @Column({ name: 'MOTIESTPROERPUSU' })
  motivoEstanProlonErpUsuCode: EstanciaProlongadaErpUsuarioCode;

  @Column({ name: 'OBSESTPROERPUSU' })
  observacionEstanProlonErpUsu: string;

  @Column({ name: 'AGRUESTPROIPS' })
  agruEstanProlonIpsCode: AgruEstanProloIpsCode;

  @Column({ name: 'MOTIESTPROIPS' })
  motivoEstanProlonIpsCode: EstanciaProlongadaIpsCode;

  @Column({ name: 'OBSESTPROIPS' })
  observacionEstanProlonIps: string;

  @ManyToOne(() => EspecialidadOrm)
  @JoinColumn({ name: TABLE_NAMES.gen.medicos.especialidad })
  especialidad: EspecialidadOrm;

  @Column({ name: TABLE_NAMES.gen.medicos.especialidad })
  especialidadId: number;

  @Column({ name: TABLE_NAMES.gen.pct.pacientes })
  pacienteId: number;

  @Column({ name: TABLE_NAMES.adn.ingresos })
  ingresoId: number;

  @ManyToOne(() => AuditoriaOrm, auditoria => auditoria.medicamentosTrazadores)
  @JoinColumn({ name: TABLE_NAMES.hpn.auditoria.index })
  auditoria: AuditoriaOrm;

  @Column({ name: TABLE_NAMES.hpn.auditoria.index })
  auditoriaId: number;

  agruEstanProlonErpUsu: AgruEstanProloErpType;

  agruEstanProlonIps: AgruEstanProloIpsType;

  setTypes(removeCodes: boolean) {
    if (this.agruEstanProlonErpUsuCode) {
      this.agruEstanProlonErpUsu = agruEstanProlErpTypeFactory(this.agruEstanProlonErpUsuCode);
    }

    if (this.agruEstanProlonIpsCode) {
      this.agruEstanProlonIps = agruEstanProlIpsTypeFactory(this.agruEstanProlonIpsCode);
    }

    if (removeCodes) {
      delete this.agruEstanProlonErpUsuCode;
      delete this.agruEstanProlonIpsCode;
    }
  }
}

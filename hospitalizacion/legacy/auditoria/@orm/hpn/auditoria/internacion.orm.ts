import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import {
  TipoInternacionCode,
  TipoInternacionType,
  tipoInternacionTypeFactory,
} from '@hpn/lgc/aud/types/hpn/auditoria';
import { AuditoriaOrm } from './auditoria.orm';
import { EstanciaOrm } from '@hpn/lgc/aud/orm/temp';

@Entity(TABLE_NAMES.hpn.auditoria.internaciones)
export class InternacionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: TABLE_NAMES.gen.pct.pacientes })
  pacienteId: number;

  @Column({ name: TABLE_NAMES.hpn.auditoria.index })
  auditoriaId: number;

  @Column({ name: TABLE_NAMES.hpn.estancias.index })
  estanciaId: number;

  @Column({ name: TABLE_NAMES.adn.ingresos })
  ingresoId: number;

  @ManyToOne(() => AuditoriaOrm, auditoria => auditoria.internaciones)
  @JoinColumn({ name: TABLE_NAMES.hpn.auditoria.index })
  auditoria: AuditoriaOrm;

  @ManyToOne(() => EstanciaOrm)
  @JoinColumn([{ name: TABLE_NAMES.hpn.estancias.index, referencedColumnName: 'id' }])
  estancia: EstanciaOrm;

  @Column({ name: 'TIPOCODE' })
  tipoCode: TipoInternacionCode;

  @Column({ name: 'FECHAINICIO' })
  fechaInicio: Date;

  @Column({ name: 'FECHAFINAL' })
  fechaFinal: Date;

  tipo: TipoInternacionType;

  setTypes(removeCodes: boolean) {
    this.tipo = tipoInternacionTypeFactory(this.tipoCode);

    if (removeCodes) {
      delete this.tipoCode;
    }
  }
}

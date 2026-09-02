import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import {
  MedicamentoTrazadorCode,
  MedicamentoTrazadorType,
  medicamentoTrazadorTypeFactory,
} from '@hpn/lgc/aud/types/hpn/auditoria';
import { AuditoriaOrm } from './auditoria.orm';

@Entity(TABLE_NAMES.hpn.auditoria.medicamentosTrazadores)
export class MedicamentoTrazadorOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'MEDICAMENTOKEY' })
  codigo: MedicamentoTrazadorCode;

  @Column({ name: 'MEDICAMENTOBS' })
  observacion: string;

  medicamentoTrazador: MedicamentoTrazadorType;

  @ManyToOne(() => AuditoriaOrm, auditoria => auditoria.medicamentosTrazadores)
  @JoinColumn({ name: TABLE_NAMES.hpn.auditoria.index })
  auditoria: AuditoriaOrm;

  @Column({ name: TABLE_NAMES.hpn.auditoria.index })
  auditoriaId: number;

  setTypes(removeCodes: boolean) {
    this.medicamentoTrazador = medicamentoTrazadorTypeFactory(this.codigo);

    if (removeCodes) {
      delete this.codigo;
    }
  }
}

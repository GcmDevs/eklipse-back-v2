import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import {
  EstudioDXCode,
  EstudioDXType,
  estudioDxTypeFactory,
} from '@hpn/lgc/aud/types/hpn/auditoria';
import { TABLE_NAMES } from '@common/application/constants';
import { AuditoriaOrm } from './auditoria.orm';

@Entity(TABLE_NAMES.hpn.auditoria.estudiosDx)
export class EstudioDxOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ESTUDXKEY' })
  estudioDxCode: EstudioDXCode;

  @Column({ name: 'FECHAINICIO' })
  inicio: Date;

  @Column({ name: 'FECHAFINAL' })
  fin: Date;

  estudioDx: EstudioDXType;

  @ManyToOne(() => AuditoriaOrm, auditoria => auditoria.medicamentosTrazadores)
  @JoinColumn({ name: TABLE_NAMES.hpn.auditoria.index })
  auditoria: AuditoriaOrm;

  @Column({ name: TABLE_NAMES.hpn.auditoria.index })
  auditoriaId: number;

  setTypes(removeCodes: boolean) {
    this.estudioDx = estudioDxTypeFactory(this.estudioDxCode);

    if (removeCodes) {
      delete this.estudioDxCode;
    }
  }
}

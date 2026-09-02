import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { AuditoriaOrm } from './auditoria.orm';
import {
  EventoSeguridadClinicaCode,
  EventoSeguridadClinicaType,
  eventoSeguridadClinicaTypeFactory,
} from '@hpn/lgc/aud/types/hpn/auditoria';

@Entity(TABLE_NAMES.hpn.auditoria.eventoSeguridadClinica)
export class EventoSeguridadClinicaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'EVENTO' })
  eventoCode: EventoSeguridadClinicaCode;

  @Column({ name: 'FECHEVEN' })
  fechaEvento: Date;

  @Column({ name: 'FECHEREPVEN' })
  fechaReporteEvento: Date;

  @Column({ name: 'DESCRIEVEN' })
  descripcion: string;

  @Column({ name: TABLE_NAMES.gen.pct.pacientes })
  pacienteId: number;

  @Column({ name: TABLE_NAMES.adn.ingresos })
  ingresoId: number;

  @ManyToOne(() => AuditoriaOrm, auditoria => auditoria.medicamentosTrazadores)
  @JoinColumn({ name: TABLE_NAMES.hpn.auditoria.index })
  auditoria: AuditoriaOrm;

  @Column({ name: TABLE_NAMES.hpn.auditoria.index })
  auditoriaId: number;

  evento: EventoSeguridadClinicaType;

  setTypes(removeCodes: boolean) {
    if (this.eventoCode) {
      this.evento = eventoSeguridadClinicaTypeFactory(this.eventoCode);
    }

    if (removeCodes) {
      delete this.eventoCode;
    }
  }
}

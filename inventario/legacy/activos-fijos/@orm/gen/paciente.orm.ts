import { TABLE_NAMES } from '@common/application/constants';
import { Entity, OneToMany, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IngresoOrm } from './ingreso.orm';

@Entity(TABLE_NAMES.gen.pct.pacientes)
export class PacienteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'PACNUMDOC' })
  numDoc: string;

  @Column({ name: 'GPAFECEXP' })
  fecExpDoc: Date;

  @Column({ name: 'PACEXPEDI' })
  lugarExpDoc: string;

  @Column({ name: 'GPANOMCOM' })
  nombreCompleto: string;

  @Column({ name: 'GPAFECNAC' })
  fechaNacimiento: Date;

  @OneToMany(() => IngresoOrm, ingreso => ingreso.paciente)
  ingresos: IngresoOrm[];

  documento: {
    numero: string;
    fechaExpedicion: Date;
    lugarExpedicion: string;
  };

  setTypes(removeTypeCodes?: boolean) {
    this.documento = {
      numero: this.numDoc,
      fechaExpedicion: this.fecExpDoc,
      lugarExpedicion: this.lugarExpDoc,
    };

    if (removeTypeCodes) {
      delete this.numDoc;
      delete this.fecExpDoc;
      delete this.lugarExpDoc;
    }
  }
}

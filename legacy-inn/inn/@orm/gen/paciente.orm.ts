import { Entity, OneToMany, PrimaryGeneratedColumn, Column } from 'typeorm';
import {
  TipoDocumentoCode,
  TipoDocumentoType,
  tipoDocumentoTypeFactory,
} from '@inn/ek-types/gen/paciente';
import { IngresoOrm } from '@inn/orm/adn';

@Entity('GENPACIEN')
export class PacienteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'PACTIPDOC' })
  tipoDocumentoCode: TipoDocumentoCode;

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

  puedeTenerDevolucionMedicamentos = false;

  documento: {
    tipo: TipoDocumentoType;
    numero: string;
    fechaExpedicion: Date;
    lugarExpedicion: string;
  };

  setTypes(removeTypeCodes?: boolean) {
    this.documento = {
      tipo: tipoDocumentoTypeFactory(this.tipoDocumentoCode),
      numero: this.numDoc,
      fechaExpedicion: this.fecExpDoc,
      lugarExpedicion: this.lugarExpDoc,
    };

    if (removeTypeCodes) {
      delete this.tipoDocumentoCode;
      delete this.numDoc;
      delete this.fecExpDoc;
      delete this.lugarExpDoc;
    }
  }
}

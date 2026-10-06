import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { GeneroCode, GeneroType, generoTypeFactory } from '@lgc/die/domain/types/local';

@Entity('GENPACIEN')
export class PacienteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'PACTIPDOC' })
  tipoDocumentoCode: number;

  @Column({ name: 'PACNUMDOC' })
  numeroDoc: string;

  @Column({ name: 'GPAFECEXP' })
  fechaExpDoc: Date;

  @Column({ name: 'PACEXPEDI' })
  lugarExpDoc: string;

  @Column({ name: 'GPANOMCOM' })
  nombreCompleto: string;

  @Column({ name: 'GPAFECNAC' })
  fechaNacimiento: Date;

  @Column({ name: 'GPASEXPAC' })
  generoCode: GeneroCode;

  documento: {
    numero: string;
    fechaExpedicion: Date;
    lugarExpedicion: string;
  };

  genero: GeneroType;

  setTypes(removeTypeCodes?: boolean) {
    this.genero = generoTypeFactory(this.generoCode);

    this.documento = {
      numero: this.numeroDoc,
      fechaExpedicion: this.fechaExpDoc,
      lugarExpedicion: this.lugarExpDoc,
    };

    if (removeTypeCodes) {
      delete this.tipoDocumentoCode;
      delete this.generoCode;
      delete this.numeroDoc;
      delete this.lugarExpDoc;
      delete this.fechaExpDoc;
    }
  }
}

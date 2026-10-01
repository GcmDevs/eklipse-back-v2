import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { RSAServices } from '@common/application/services';

@Entity(TABLE_NAMES.gen.terceros)
export class TerceroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TERNUMDOC', length: 20 })
  numeroDocumento: string;

  @Column({ name: 'TERTIPDOC' })
  tipoDocumento: number;

  @Column({ name: 'TERDIGITO', length: 1, nullable: true })
  digitoVerifiDocumento: string;

  @Column({ name: 'TEREXPEDI', length: 60 })
  lugarExpediDocumento: string;

  @Column({ name: 'TERNOMCOM', length: 200 })
  nombreCompleto: string;

  /** @deprecated */
  documento = {
    numero: '',
    tipo: 0,
    digitoVerificacion: '',
    lugarExpedicion: '',
  };

  /** @deprecated */
  setDocumentoForHumans() {
    this.documento.numero = this.numeroDocumento;
    this.documento.tipo = this.tipoDocumento;
    this.documento.digitoVerificacion = this.digitoVerifiDocumento;
    this.documento.lugarExpedicion = this.lugarExpediDocumento;

    delete this.numeroDocumento;
    delete this.tipoDocumento;
    delete this.digitoVerifiDocumento;
    delete this.lugarExpediDocumento;
  }

  /** @deprecated */
  encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }

  /** @deprecated */
  decryptId() {
    this.id = RSAServices.decryptId(this.id as any);
  }
}

import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { EstanciasProlongadasOrm } from './estancia-prolongada.orm';

@Entity({ name: 'EKHPNESTPROACCIONWHATSAPP' })
export class AccionWhatsappOrm {
  @PrimaryColumn({ name: 'OID', type: 'int' })
  id: number;

  @Column({ name: 'ESTANCIAPROLONGADAID', type: 'int' })
  estanciaProlongadaId: number;

  @ManyToOne(() => EstanciasProlongadasOrm)
  estanciaProlongada: EstanciasProlongadasOrm;

  @Column({ name: 'ACCIONID', type: 'int' })
  accionId: number;

  @Column({ name: 'CONTACTOID', type: 'int' })
  contactoId: number;

  @Column({ name: 'TELEFONOSNAPSHOT', type: 'string' })
  telefonoSnapshot: string;

  @Column({ name: 'ACCIONSNAPSHOT', type: 'string' })
  accionSnapshot: string;

  @Column({ name: 'TEXTOADICIONAL', type: 'string' })
  textoAdicional: string;

  @Column({ name: 'ESTADO', type: 'string' })
  estado: string;

  @Column({ name: 'OPENWAMESSAGEID', type: 'string' })
  openWAMessageId: string;

  @Column({ name: 'ERROR', type: 'string' })
  error: string;

  @Column({ name: 'CREATEDAT', type: 'datetime' })
  createdAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { MedicamentoOrm } from './medicamento.orm';
import { FolioOrm } from './folio.orm';

@Entity('HCNMEDPAC')
export class SltMedicamentoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HCSOBSERV' })
  observacion: string;

  @Column({ name: 'HCSFECSOL' })
  fechaSolicitud: string;

  @Column({ name: 'HCSCANRES' })
  cantidad: number;

  @Column({ name: 'INNPRODUC' })
  medicamentoId: number;

  @ManyToOne(() => MedicamentoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  medicamento: MedicamentoOrm;

  @Column({ name: 'HCNFOLIO' })
  folioId: number;

  @ManyToOne(() => FolioOrm)
  @JoinColumn([{ name: 'HCNFOLIO', referencedColumnName: 'id' }])
  folio: FolioOrm;

  get originalColumnName() {
    return 'HCNMEDPAC';
  }
}

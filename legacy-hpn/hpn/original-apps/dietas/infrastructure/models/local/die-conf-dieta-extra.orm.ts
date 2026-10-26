import { getDateToString } from '@common/application/services';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('PDYDIECONFEXT')
export class DietaConfExtraOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GENPACIEN' })
  pacienteId: number;

  @Column({ name: 'DIEFAMDES' })
  incluyeDietaFamiliarDesayuno: boolean;

  @Column({ name: 'DIEFAMALM' })
  incluyeDietaFamiliarAlmuerzo: boolean;

  @Column({ name: 'DIEFAMCEN' })
  incluyeDietaFamiliarCena: boolean;

  @Column({ name: 'MERIDES' })
  incluyeMeriendaDesayuno: boolean;

  @Column({ name: 'MERIALM' })
  incluyeMeriendaAlmuerzo: boolean;

  @Column({ name: 'MERICEN' })
  incluyeMeriendaCena: boolean;

  @Column({ name: 'TIPOMERALL', length: 20 })
  tipoMerienda: string;

  @Column({ name: 'ULTIJORREG' })
  fechaUltimaDietaRegistrada: Date;

  isLessThanMaxDays = false;

  verifyIfConfigIsLessThanMaxDays(days = 3) {
    const date = new Date(`${this.fechaUltimaDietaRegistrada}`).getTime();
    const now = new Date(getDateToString(new Date())).getTime();
    const diff = now - date;

    const result = diff < 86400000 * days;

    this.isLessThanMaxDays = result;
  }
}

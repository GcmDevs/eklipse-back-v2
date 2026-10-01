import { SignoVitalType } from '@hpn/gestion-clinica/v1/domain/types';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('GCMHPNSIGNOVITAL')
export class SignoVitalOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TA' })
  ta: string;

  @Column({ name: 'FC', type: 'decimal' })
  fc: number;

  @Column({ name: 'FCF', type: 'decimal' })
  fcf: number;

  @Column({ name: 'FR', type: 'decimal' })
  fr: number;

  @Column({ name: 'SATO2', type: 'decimal' })
  sato2: number;

  @Column({ name: 'GLASGOW', type: 'decimal' })
  glasgow: number;

  @Column({ name: 'TEMP', type: 'decimal' })
  temp: number;

  @Column({ name: 'PESO', type: 'decimal' })
  peso: number;

  @Column({ name: 'TALLA', type: 'decimal' })
  talla: number;

  @Column({ name: 'USUARIO' })
  usuarioId: number;

  @Column({ name: 'INICIADOPORCENTRO' })
  iniciadoPorCentro: number;

  @Column({ name: 'FECHACREACION' })
  createdAt: Date;

  @Column({ name: 'OBSERVACION' })
  observacion: string;

  items: any[] = [];

  set(signo: SignoVitalType, cantidad: number, uni?: string) {
    const sg = {
      signo: signo,
      cantidad: cantidad,
      unidad: uni,
    };
    this.items.push(sg);
  }
}

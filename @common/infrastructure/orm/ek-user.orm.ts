import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('GENUSUEXT')
export class _PrivSecEkUserOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'DOCUMENTO' })
  document: string;

  @Column({ name: 'NOMCOM' })
  fullName: string;

  @Column({ name: 'PASSWORD', select: false })
  password: string;

  @Column({ name: 'ESTADO' })
  statusCode: number;

  @Column({ name: 'LASTAUTH' })
  lastAuth: Date;

  @Column({ name: 'ISRESET' })
  passwordIsReset: boolean;
}

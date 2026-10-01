import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ADNCENATE')
export class EkCenterOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CODIGO' })
  code: string;

  @Column({ name: 'NOMBRE' })
  name: string;

  @Column({ name: 'CONTEXTO' })
  context: string;

  @Column({ name: 'NIT' })
  nit: string;

  @Column({ name: 'ORIGINALID' })
  originalId: number;
}

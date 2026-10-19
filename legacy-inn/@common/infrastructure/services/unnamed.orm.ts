import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('UNNAMED')
export class JustForVerifyOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;
}

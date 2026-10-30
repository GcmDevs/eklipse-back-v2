import { PrimaryGeneratedColumn } from 'typeorm';

export abstract class BaseOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;
}

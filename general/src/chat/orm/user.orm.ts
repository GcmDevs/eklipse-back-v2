import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('CHATUSUREG', { schema: 'dbo' })
export class ChatUserOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'USUDOCUME' })
  document: string;

  @Column({ name: 'USUDESCRI' })
  fullName: string;
}

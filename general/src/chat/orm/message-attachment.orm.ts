import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChatMessageOrm } from './message.orm';

@Entity('CHATMENARCHIVO')
export class ChatMessageAttachmentOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CHATMENSAJE' })
  messageId: number;

  @ManyToOne(() => ChatMessageOrm, message => message.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'CHATMENSAJE' })
  message: ChatMessageOrm;

  @Column({ name: 'UBICACION', length: 500 })
  path: string;
}

import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChatUserOrm } from './chat-user.orm';

@Entity('CHATMENSAJE')
export class ChatMessageOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CONVERSACION' })
  conversationId: number;

  @Column({ name: 'CHATUSUREG1' })
  senderUserId: number;

  @ManyToOne(() => ChatUserOrm)
  @JoinColumn({ name: 'CHATUSUREG1' })
  senderUser: ChatUserOrm;

  @Column({ name: 'CHATUSUREG2' })
  recipientUserId: number;

  @ManyToOne(() => ChatUserOrm)
  @JoinColumn({ name: 'CHATUSUREG2' })
  recipientUser: ChatUserOrm;

  @Column({ name: 'CONTENIDO', length: 1000 })
  content: string;

  @Column({ name: 'FECCRE' })
  createdAt: Date;
}

import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChatConversationOrm } from './conversation.orm';
import { ChatMessageOrm } from './message.orm';
import { ChatUserOrm } from './user.orm';

@Entity('CHATCONLECTURA')
export class ChatConversationReadOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CHATCONVERSACION' })
  conversationId: number;

  @ManyToOne(() => ChatConversationOrm)
  @JoinColumn({ name: 'CHATCONVERSACION' })
  conversation: ChatConversationOrm;

  @Column({ name: 'CHATUSUREG' })
  userId: number;

  @ManyToOne(() => ChatUserOrm)
  @JoinColumn({ name: 'CHATUSUREG' })
  user: ChatUserOrm;

  @Column({ name: 'CHATMENSAJE', nullable: true })
  lastReadMessageId?: number | null;

  @ManyToOne(() => ChatMessageOrm, { nullable: true })
  @JoinColumn({ name: 'CHATMENSAJE' })
  lastReadMessage?: ChatMessageOrm | null;

  @Column({ name: 'FECACT' })
  updatedAt: Date;
}

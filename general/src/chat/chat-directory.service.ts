import { Injectable } from '@nestjs/common';
import { GCM_CONTEXTS } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services';
import { ChatUserOrm } from './chat-user.orm';
import type { ChatUser } from './chat.types';
import { normalizeDocument } from './chat.types';

@Injectable()
export class ChatDirectoryService {
  private static readonly MAX_SEARCH_RESULTS = 20;
  private readonly sharedConn = switchConn(GCM_CONTEXTS.EKLIPSE);

  async search(query: string, excludeDocument = ''): Promise<ChatUser[]> {
    const term = query.trim().slice(0, 80);
    if (!term) return [];

    const escapedTerm = term.replace(/\[/g, '[[]').replace(/%/g, '[%]').replace(/_/g, '[_]');
    const records = await this.sharedConn
      .getRepository(ChatUserOrm)
      .createQueryBuilder('chatUser')
      .where('(chatUser.USUDOCUME LIKE :term OR chatUser.USUDESCRI LIKE :term)', {
        term: `%${escapedTerm}%`,
      })
      .orderBy('chatUser.USUDESCRI', 'ASC')
      .take(ChatDirectoryService.MAX_SEARCH_RESULTS)
      .getMany();
    const usersByDocument = new Map<string, ChatUser>();
    const excluded = normalizeDocument(excludeDocument);

    for (const record of records) {
      const user = this.toChatUser(record);
      if (user && user.document !== excluded) usersByDocument.set(user.document, user);
    }

    return [...usersByDocument.values()];
  }

  async findByDocument(document: unknown): Promise<ChatUser | undefined> {
    const normalized = normalizeDocument(document);
    if (!normalized) return undefined;

    const record = await this.sharedConn.getRepository(ChatUserOrm).findOne({
      where: { document: normalized },
    });
    return record ? this.toChatUser(record) : undefined;
  }

  private toChatUser(record: ChatUserOrm): ChatUser | undefined {
    const document = normalizeDocument(String(record.document ?? ''));
    const name = String(record.fullName ?? '').trim();
    return document && name ? { document, name } : undefined;
  }
}

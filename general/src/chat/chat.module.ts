import { Module } from '@nestjs/common';
import { ChatDirectoryService } from './chat-directory.service';
import { ChatGateway } from './chat.gateway';
import { ChatStoreService } from './chat-store.service';

@Module({
  providers: [ChatDirectoryService, ChatStoreService, ChatGateway],
})
export class ChatModule {}

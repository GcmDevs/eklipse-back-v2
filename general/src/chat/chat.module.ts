import { Module } from '@nestjs/common';
import { ChatDirectoryService } from './chat-directory.service';
import { ChatGateway } from './chat.gateway';
import { ChatStoreService } from './chat-store.service';
import { ChatSecurityService } from './chat-security.service';
import { FileSaverModule } from '../file-server';

@Module({
  imports: [FileSaverModule],
  providers: [ChatDirectoryService, ChatSecurityService, ChatStoreService, ChatGateway],
})
export class ChatModule {}

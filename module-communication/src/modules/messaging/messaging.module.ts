import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {UserReference} from '@/entities/external/user-reference.entity';
import {CallHistory} from '@/entities/internal/call-history.entity';
import {GroupChat} from '@/entities/internal/group-chat.entity';
import {GroupChatMessage} from '@/entities/internal/group-chat-message.entity';
import {Message} from '@/entities/internal/message.entity';
import {MessageAttachment} from '@/entities/internal/message-attachment.entity';
import {MessageText} from '@/entities/internal/message-text.entity';

import {MessagingController} from './messaging.controller';
import {MessagingService} from './messaging.service';
@Module({
    imports: [
        TypeOrmModule.forFeature([
            CallHistory,
            GroupChat,
            MessageAttachment,
            MessageText,
            Message,
            GroupChatMessage,
            UserReference,
        ]),
    ],
    controllers: [MessagingController],
    providers: [MessagingService],
    exports: [MessagingService],
})
export class MessagingModule {}

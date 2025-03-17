import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {CallHistories} from '@/entities/call-history.entity';
import {GroupChat} from '@/entities/group-chat.entity';
import {Message} from '@/entities/message.entity';
import {MessageAttachment} from '@/entities/message-attachment.entity';
import {MessageText} from '@/entities/message-text.entity';
import {UserMessagesGroupChat} from '@/entities/user-messages-group-chat.entity';
import {UserMessagesUser} from '@/entities/user-messages-user.entity';

import {MessagingController} from './messaging.controller';
import {MessagingService} from './messaging.service';
@Module({
    imports: [
        TypeOrmModule.forFeature([
            CallHistories,
            GroupChat,
            MessageAttachment,
            MessageText,
            Message,
            UserMessagesUser,
            UserMessagesGroupChat,
        ]),
    ],
    controllers: [MessagingController],
    providers: [MessagingService],
    exports: [MessagingService],
})
export class MessagingModule {}

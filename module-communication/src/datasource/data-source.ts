import {DataSource} from 'typeorm';

import {UserReference} from '@/entities/external/user-reference.entity';
import {CallHistory} from '@/entities/internal/call-history.entity';
import {GroupChat} from '@/entities/internal/group-chat.entity';
import {GroupChatMessage} from '@/entities/internal/group-chat-message.entity';
import {Message} from '@/entities/internal/message.entity';
import {MessageAttachment} from '@/entities/internal/message-attachment.entity';
import {MessageText} from '@/entities/internal/message-text.entity';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5435,
    username: 'postgres',
    password: 'postgres',
    database: 'infinivista-communication',
    entities: [Message, CallHistory, GroupChat, MessageAttachment, MessageText, GroupChatMessage, UserReference],
    migrations: ['migrations/*.ts'],
    synchronize: false,
    migrationsRun: true, // set to false in production
});

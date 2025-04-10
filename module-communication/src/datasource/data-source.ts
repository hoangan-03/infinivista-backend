import {DataSource} from 'typeorm';

import {UserReference} from '@/entities/external/user-reference.entity';
import {CallHistory} from '@/entities/internal/call-history.entity';
import {GroupChat} from '@/entities/internal/group-chat.entity';
import {GroupChatAttachment} from '@/entities/internal/group-chat-attachment.entity';
import {GroupChatMessage} from '@/entities/internal/group-chat-message.entity';
import {Message} from '@/entities/internal/message.entity';
import {MessageAttachment} from '@/entities/internal/message-attachment.entity';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5435,
    username: 'postgres',
    password: 'postgres',
    database: 'infinivista-communication',
    entities: [
        Message,
        CallHistory,
        GroupChat,
        MessageAttachment,
        GroupChatMessage,
        UserReference,
        GroupChatAttachment,
    ],
    migrations: ['migrations/*.ts'],
    synchronize: false,
    migrationsRun: true, // set to false in production
});

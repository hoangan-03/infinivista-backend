import {DataSource} from 'typeorm';

import {CallHistories} from '@/entities/call-histories.entity';
import {GroupChat} from '@/entities/group-chat.entity';
import {Message} from '@/entities/message.entity';
import {MessageAttachment} from '@/entities/message-attachment.entity';
import {MessageText} from '@/entities/message-text.entity';
import {UserMessagesGroupChat} from '@/entities/user-messages-group-chat.entity';
import {UserMessagesUser} from '@/entities/user-messages-user.entity';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5435,
    // host: 'db',
    // port: 5432,
    // For inside Docker container
    username: 'postgres',
    password: 'postgres',
    database: 'infinivista-communication',
    entities: [
        Message,
        CallHistories,
        GroupChat,
        UserMessagesGroupChat,
        UserMessagesUser,
        MessageAttachment,
        MessageText,
    ],
    migrations: ['migrations/*.ts'],
    synchronize: true, // set to false in production
});

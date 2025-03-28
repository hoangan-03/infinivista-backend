import {DataSource} from 'typeorm';

import {NewsFeedReference} from '@/entities/external/newsfeed-ref.entity';
import {Friend} from '@/entities/local/friend.entity';
import {FriendRequest} from '@/entities/local/friend-request.entity';
import {PaymentMethods} from '@/entities/local/payment-methods.entity';
import {SecurityAnswer} from '@/entities/local/security-answer.entity';
import {SecurityQuestion} from '@/entities/local/security-question.entity';
import {Setting} from '@/entities/local/setting.entity';
import {User} from '@/entities/local/user.entity';
import {UserStatus} from '@/entities/local/user-status.entity';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'infinivista-user',
    entities: [
        User,
        SecurityQuestion,
        SecurityAnswer,
        Setting,
        PaymentMethods,
        UserStatus,
        FriendRequest,
        Friend,
        NewsFeedReference,
    ],
    migrations: ['migrations/*.ts'],
    synchronize: true, // set to false in production
});

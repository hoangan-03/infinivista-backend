import {DataSource} from 'typeorm';

import {NewsFeedReference} from '@/entities/external/newsfeed-ref.entity';
import {Friend} from '@/entities/local/friend.entity';
import {FriendRequest} from '@/entities/local/friend-request.entity';
import {SecurityAnswer} from '@/entities/local/security-answer.entity';
import {SecurityQuestion} from '@/entities/local/security-question.entity';
import {Setting} from '@/entities/local/setting.entity';
import {SocialLink} from '@/entities/local/social-link.entity';
import {User} from '@/entities/local/user.entity';
import {UserStatus} from '@/entities/local/user-status.entity';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5435,
    username: 'postgres',
    password: 'postgres',
    database: 'infinivista-user',
    entities: [
        User,
        SecurityQuestion,
        SecurityAnswer,
        SocialLink,
        Setting,
        UserStatus,
        FriendRequest,
        Friend,
        NewsFeedReference,
    ],
    migrations: ['migrations/*.ts'],
    synchronize: false,
    migrationsRun: true, // set to false in production
});

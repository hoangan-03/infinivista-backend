import {DataSource} from 'typeorm';

import {Friend} from '@/entities/friend.entity';
import {FriendRequest} from '@/entities/friend-request.entity';
import {PaymentMethods} from '@/entities/payment-methods.entity';
import {SecurityAnswer} from '@/entities/security-answer.entity';
import {SecurityQuestion} from '@/entities/security-question.entity';
import {Setting} from '@/entities/setting.entity';
import {User} from '@/entities/user.entity';
import {UserStatus} from '@/entities/user-status.entity';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'infinivista_db',
    port: 5432,
    // host: 'db',
    // port: 5432,
    // For inside Docker container
    username: 'postgres',
    password: 'postgres',
    database: 'infinivista-user',
    entities: [User, SecurityQuestion, SecurityAnswer, Setting, PaymentMethods, UserStatus, FriendRequest, Friend],
    migrations: ['migrations/*.ts'],
    synchronize: true, // set to false in production
});

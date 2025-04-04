import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {Friend} from '@/entities/local/friend.entity';
import {FriendRequest} from '@/entities/local/friend-request.entity';
import {PaymentMethods} from '@/entities/local/payment-methods.entity';
import {SecurityAnswer} from '@/entities/local/security-answer.entity';
import {SecurityQuestion} from '@/entities/local/security-question.entity';
import {Setting} from '@/entities/local/setting.entity';
import {User} from '@/entities/local/user.entity';
import {UserStatus} from '@/entities/local/user-status.entity';

import {SeedHandlerController} from './seed-handler';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            UserStatus,
            Setting,
            SecurityQuestion,
            SecurityAnswer,
            Friend,
            FriendRequest,
            PaymentMethods,
        ]),
    ],
    controllers: [SeedHandlerController],
})
export class SeederModule {}

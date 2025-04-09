import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {NewsFeedReference} from '@/entities/external/newsfeed-ref.entity';
import {Friend} from '@/entities/local/friend.entity';
import {FriendRequest} from '@/entities/local/friend-request.entity';
import {PaymentMethods} from '@/entities/local/payment-methods.entity';
import {SecurityAnswer} from '@/entities/local/security-answer.entity';
import {SecurityQuestion} from '@/entities/local/security-question.entity';
import {Setting} from '@/entities/local/setting.entity';
import {User} from '@/entities/local/user.entity';
import {UserStatus} from '@/entities/local/user-status.entity';
import {UserController} from '@/modules/user/controllers/user.controller';
import {UserService} from '@/modules/user/services/user.service';

import {FriendController} from './controllers/friend.controller';
import {FriendService} from './services/friend.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Setting,
            UserStatus,
            SecurityAnswer,
            SecurityQuestion,
            PaymentMethods,
            FriendRequest,
            Friend,

            NewsFeedReference,
        ]),
    ],
    controllers: [UserController, FriendController],
    providers: [UserService, FriendService],
    exports: [UserService, FriendService],
})
export class UserModule {}

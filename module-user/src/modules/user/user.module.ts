import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {Friend} from '@/entities/friend.entity';
import {FriendRequest} from '@/entities/friend-request.entity';
import {PaymentMethods} from '@/entities/payment-methods.entity';
import {SecurityAnswer} from '@/entities/security-answer.entity';
import {SecurityQuestion} from '@/entities/security-question.entity';
import {Setting} from '@/entities/setting.entity';
import {User} from '@/entities/user.entity';
import {UserStatus} from '@/entities/user-status.entity';
import {UsersController} from '@/modules/user/controllers/user.controller';
import {UserService} from '@/modules/user/services/user.service';
import {IsUserAlreadyExist} from '@/modules/user/validators/is-user-already-exist.validator';
import {IsUserNameAlreadyExist} from '@/modules/user/validators/is-username-already-exist.validator';
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
        ]),
    ],
    controllers: [UsersController],
    providers: [UserService, IsUserAlreadyExist, IsUserNameAlreadyExist],
    exports: [UserService],
})
export class UserModule {}

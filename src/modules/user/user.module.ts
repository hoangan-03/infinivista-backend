import { Module } from "@nestjs/common";
import { UserService } from "@/modules/user/services/user.service";
import { UsersController } from "@/modules/user/user.controller";
import { User } from "@/entities/user.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IsUserAlreadyExist } from "@/modules/user/validators/is-user-already-exist.validator";
import { Setting } from "@/entities/setting.entity";
import { SecurityAnswer } from "@/entities/security-answer.entity";
import { UserStatus } from "@/entities/user-status.entity";
import { PaymentMethods } from "@/entities/payment-methods.entity";
import { SecurityQuestion } from "@/entities/security-question.entity";
import { IsUserNameAlreadyExist } from "@/modules/user/validators/is-username-already-exist.validator";
@Module({
  imports: [TypeOrmModule.forFeature([User, Setting, UserStatus, SecurityAnswer, SecurityQuestion, PaymentMethods])],
  controllers: [UsersController],
  providers: [UserService, IsUserAlreadyExist,IsUserNameAlreadyExist],
  exports: [UserService],
})
export class UserModule {}

import { Module } from "@nestjs/common";
import { UserService } from "@/modules/user/services/user.service";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UsersController } from "@/modules/user/user.controller";

import { User } from "@/entities/user.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IsUserAlreadyExist } from "./validators/is-user-already-exist.validator";
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UserService, IsUserAlreadyExist],
  exports: [UserService],
})
export class UserModule {}

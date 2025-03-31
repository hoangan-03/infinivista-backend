import {Module} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {JwtModule} from '@nestjs/jwt';
import {PassportModule} from '@nestjs/passport';
import {TypeOrmModule} from '@nestjs/typeorm';

import {User} from '@/entities/local/user.entity';
import {AuthController} from '@/modules/auth/auth.controller';
import {AuthService} from '@/modules/auth/auth.service';
import {UserModule} from '@/modules/user/user.module';

import {TokenBlacklistService} from './token-blacklist/token-blacklist.service';
import {IsUserAlreadyExist} from './validators/is-user-already-exist.validator';
import {IsUserNameAlreadyExist} from './validators/is-username-already-exist.validator';

@Module({
    imports: [
        ConfigModule,
        UserModule,
        TypeOrmModule.forFeature([User]),
        PassportModule.register({defaultStrategy: 'jwt'}),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: '24h',
                    algorithm: 'HS384',
                },
                verifyOptions: {
                    algorithms: ['HS384'],
                },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, TokenBlacklistService, IsUserNameAlreadyExist, IsUserAlreadyExist],
})
export class AuthModule {}

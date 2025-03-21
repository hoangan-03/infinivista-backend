import {Module} from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {JwtModule} from '@nestjs/jwt';
import {PassportModule} from '@nestjs/passport';

import {AuthController} from '@/modules/auth/auth.controller';
import {AuthService} from '@/modules/auth/auth.service';
import {UserModule} from '@/modules/user/user.module';

import {TokenBlacklistService} from './token-blacklist/token-blacklist.service';

@Module({
    imports: [
        ConfigModule,
        UserModule,
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
    providers: [AuthService, TokenBlacklistService],
})
export class AuthModule {}

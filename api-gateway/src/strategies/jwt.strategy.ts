import {Inject, Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {ClientProxy} from '@nestjs/microservices';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, JwtFromRequestFunction, Strategy} from 'passport-jwt';
import {lastValueFrom} from 'rxjs';

import {User} from '@/entities/user-module/user.entity';
// import {AuthService} from '@/modules/auth/auth.service';
import {JwtPayload} from '@/interfaces/jwt-payload.interface';

const extractJwtFromCookie: JwtFromRequestFunction = (request) => {
    return request.signedCookies['token']!;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        // private readonly authService: AuthService,
        @Inject('USER_SERVICE') private userClient: ClientProxy,
        private readonly configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([extractJwtFromCookie, ExtractJwt.fromAuthHeaderAsBearerToken()]),
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
            ignoreExpiration: false,
            passReqToCallback: false,
        });
    }

    async validate(payload: JwtPayload): Promise<User> {
        return lastValueFrom(this.userClient.send<User>('VerifyJwtAuthCommand', {jwt: payload}));
    }
}

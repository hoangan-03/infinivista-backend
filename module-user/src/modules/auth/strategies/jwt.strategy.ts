import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, JwtFromRequestFunction, Strategy} from 'passport-jwt';

import {User} from '@/entities/user.entity';
import {AuthService} from '@/modules/auth/auth.service';
import {JwtPayload} from '@/modules/auth/interfaces/jwt-payload.interface';

const extractJwtFromCookie: JwtFromRequestFunction = (request) => {
    return request.signedCookies['token']!;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([extractJwtFromCookie, ExtractJwt.fromAuthHeaderAsBearerToken()]),
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
            ignoreExpiration: false,
            passReqToCallback: false,
        });
    }

    validate(payload: JwtPayload): Promise<User> {
        return this.authService.verifyPayload(payload);
    }
}

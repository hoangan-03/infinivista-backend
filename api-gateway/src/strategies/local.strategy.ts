import {Inject, Injectable} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-local';
import {lastValueFrom} from 'rxjs';

import {AuthTokenResponseDto} from '@/dtos/user-module/auth-token-response.dto';
import {LoginUserDTO} from '@/dtos/user-module/login-user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
    constructor(@Inject('USER_SERVICE') private userClient: ClientProxy) {
        super({
            usernameField: 'email',
            passReqToCallback: false,
        });
    }

    async validate(email: string, password: string): Promise<AuthTokenResponseDto> {
        const payload: LoginUserDTO = {email, password};
        return lastValueFrom(this.userClient.send<AuthTokenResponseDto>('LoginAuthCommand', {credentials: payload}));
    }
}

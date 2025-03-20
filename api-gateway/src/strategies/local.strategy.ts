import {Inject, Injectable, UnauthorizedException} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-local';
import {lastValueFrom} from 'rxjs';

import {User} from '@/entities/user-module/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
    constructor(@Inject('USER_SERVICE') private userClient: ClientProxy) {
        super({
            usernameField: 'email',
            passReqToCallback: false,
        });
    }

    async validate(username: string, password: string): Promise<User> {
        try {
            const user = await lastValueFrom(
                this.userClient.send<User>('ValidateUserAuthCommand', {username, password})
            );

            if (!user) {
                throw new UnauthorizedException('Invalid credentials');
            }

            return user;
        } catch (error) {
            throw new UnauthorizedException('Invalid credentials');
        }
    }
}

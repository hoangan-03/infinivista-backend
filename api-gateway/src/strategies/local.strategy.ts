import {Inject, Injectable, UnauthorizedException} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-local';
import {lastValueFrom} from 'rxjs';

import {User} from '@/entities/user-module/local/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
    constructor(@Inject('USER_SERVICE') private userClient: ClientProxy) {
        super({
            usernameField: 'identifier',
            passReqToCallback: false,
        });
    }

    async validate(identifier: string, password: string): Promise<User> {
        try {
            const user = await lastValueFrom(
                this.userClient.send<User>('ValidateUserAuthCommand', {identifier, password})
            );

            if (!user) {
                throw new UnauthorizedException('Invalid credentials');
            }

            return user;
        } catch (_error) {
            throw new UnauthorizedException(_error.message || 'Authentication failed');
        }
    }
}

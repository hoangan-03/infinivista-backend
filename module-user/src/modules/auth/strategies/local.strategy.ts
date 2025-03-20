import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-local';

import {User} from '@/entities/local/user.entity';
import {AuthService} from '@/modules/auth/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
    constructor(private readonly authService: AuthService) {
        super({
            usernameField: 'email',
            passReqToCallback: false,
        });
    }

    async validate(username: string, password: string): Promise<User> {
        return this.authService.validateUser(username, password);
    }
}

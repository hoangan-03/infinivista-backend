import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthService } from '@/modules/auth/auth.service';
import { User } from '@/modules/user/entities/user.entity';
import { AuthResponse } from '../interfaces/response.interface';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passReqToCallback: false,
    });
  }

  validate(email: string, password: string): Promise<AuthResponse> {
    return this.authService.login(email, password);
  }
}
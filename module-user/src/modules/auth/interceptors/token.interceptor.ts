// module-user/src/modules/auth/interceptors/token.interceptor.ts
import {CallHandler, ExecutionContext, Injectable, NestInterceptor} from '@nestjs/common';
import type {Response} from 'express';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import type {User} from '@/entities/local/user.entity';
import {AuthService} from '@/modules/auth/auth.service';

@Injectable()
export class TokenInterceptor implements NestInterceptor {
    constructor(private readonly authService: AuthService) {}

    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                if (!data) return data;

                const response = context.switchToHttp().getResponse<Response>();

                let user: User;

                // If it's a response with 'data' property like AuthTokenResponseDto
                if (data.data && data.data.access_token) {
                    // For login endpoint which directly returns tokens
                    response.setHeader('Authorization', `Bearer ${data.data.access_token}`);
                    response.cookie('token', data.data.access_token, {
                        httpOnly: true,
                        signed: true,
                        sameSite: 'strict',
                        secure: process.env.NODE_ENV === 'production',
                    });
                    return data;
                }

                if (data && data.id) {
                    user = data;
                    const tokens = this.authService.generateTokens(user);

                    response.setHeader('Authorization', `Bearer ${tokens.data.access_token}`);
                    response.cookie('token', tokens.data.access_token, {
                        httpOnly: true,
                        signed: true,
                        sameSite: 'strict',
                        secure: process.env.NODE_ENV === 'production',
                    });
                }

                return data;
            })
        );
    }
}

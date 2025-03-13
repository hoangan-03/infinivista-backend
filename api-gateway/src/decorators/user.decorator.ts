import {createParamDecorator, ExecutionContext} from '@nestjs/common';
import {Request} from 'express';

import {User} from '@/entities/user-module/user.entity';

// FIXME: This decorator is using unsafe any type
export const AuthUser = createParamDecorator((data: keyof User, ctx: ExecutionContext) => {
    const user = (ctx.switchToHttp().getRequest<Request>() as any).user as User;

    return data ? user && user[data] : user;
});

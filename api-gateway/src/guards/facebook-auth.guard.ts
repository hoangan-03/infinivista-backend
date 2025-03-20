import {ExecutionContext, Injectable} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';

@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook') {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const activate = await super.canActivate(context);
        const request = context.switchToHttp().getRequest();
        await super.logIn(request);
        return activate as boolean;
    }
}

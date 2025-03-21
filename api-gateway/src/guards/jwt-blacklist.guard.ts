import {CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {lastValueFrom} from 'rxjs';

@Injectable()
export class JwtBlacklistGuard implements CanActivate {
    constructor(@Inject('USER_SERVICE') private userClient: ClientProxy) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            return true; // No token, let JWT guard handle it
        }

        try {
            // Send message to user microservice to check if token is blacklisted
            const isBlacklisted = await lastValueFrom<boolean>(
                this.userClient.send('CheckTokenBlacklistCommand', {token})
            );

            if (isBlacklisted) {
                throw new UnauthorizedException('Token has been invalidated');
            }

            return true;
        } catch (error) {
            // If the microservice connection fails, log it but don't block the request
            // You might want to adjust this behavior depending on your security requirements
            if (error instanceof UnauthorizedException) {
                throw error; // Re-throw if it's our blacklist check
            }
            console.error('Error checking token blacklist:', error);
            return true;
        }
    }

    private extractTokenFromHeader(request: any): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}

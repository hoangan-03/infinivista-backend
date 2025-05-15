import {Injectable, Logger} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';

@Injectable()
export class TokenBlacklistService {
    private readonly logger = new Logger(TokenBlacklistService.name);
    private readonly tokenBlacklist = new Map<string, number>();
    private cleanupInterval: NodeJS.Timeout;

    constructor(private readonly jwtService: JwtService) {
        this.cleanupInterval = setInterval(() => this.cleanupExpiredTokens(), 60000);
    }

    onModuleDestroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }

    async blacklistToken(token: string): Promise<void> {
        try {
            if (!token) return;

            const cleanToken = token.replace('Bearer ', '');

            const decoded = this.jwtService.decode(cleanToken);

            if (!decoded || typeof decoded !== 'object') {
                return;
            }

            const exp = decoded.exp as number;

            if (!exp) {
                return;
            }

            this.tokenBlacklist.set(cleanToken, exp * 1000);
            this.logger.log(`Token blacklisted until ${new Date(exp * 1000).toISOString()}`);
        } catch (error) {
            this.logger.error('Error blacklisting token:', error);
        }
    }

    async isBlacklisted(token: string): Promise<boolean> {
        if (!token) return false;

        const cleanToken = token.replace('Bearer ', '');
        return this.tokenBlacklist.has(cleanToken);
    }

    private cleanupExpiredTokens(): void {
        const now = Date.now();
        let expiredCount = 0;

        for (const [token, expiration] of this.tokenBlacklist.entries()) {
            if (expiration < now) {
                this.tokenBlacklist.delete(token);
                expiredCount++;
            }
        }

        if (expiredCount > 0) {
            this.logger.debug(
                `Cleaned up ${expiredCount} expired tokens. Current blacklist size: ${this.tokenBlacklist.size}`
            );
        }
    }
}

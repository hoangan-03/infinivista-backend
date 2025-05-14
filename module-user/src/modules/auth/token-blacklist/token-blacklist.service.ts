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

        // Add validation for token format before checking blacklist
        try {
            // Verify this is a valid JWT token format
            const decoded = this.jwtService.verify(cleanToken);
            if (!decoded) {
                this.logger.warn('Token verification failed: Token payload empty');
                throw new Error('Invalid token: Empty payload');
            }

            // If token is valid format, check if it's blacklisted
            return this.tokenBlacklist.has(cleanToken);
        } catch (error: any) {
            // If token verification fails, consider it invalid
            this.logger.warn(`Invalid token detected: ${error.message}`);
            throw new Error('Invalid token format');
        }
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

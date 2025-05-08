import {Injectable, Logger, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';

import {User} from '@/entities/local/user.entity';
import {AuthConstant} from '@/modules/auth/constant';
import {AuthTokenResponseDto} from '@/modules/auth/dto/auth-token-response.dto';
import {RegisterUserDto} from '@/modules/auth/dto/register-user.dto';
import {RegisterUserResponseDto} from '@/modules/auth/dto/register-user-response.dto';
import {JwtPayload} from '@/modules/auth/interfaces/jwt-payload.interface';
import {FriendService} from '@/modules/user/services/friend.service';
import {UserService} from '@/modules/user/services/user.service';
import {checkPassword, hashPassword} from '@/utils/hash-password';

import {TokenBlacklistService} from './token-blacklist/token-blacklist.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly friendService: FriendService,
        private readonly tokenBlacklistService: TokenBlacklistService
    ) {}

    async register(signUp: RegisterUserDto): Promise<RegisterUserResponseDto & {tokens?: AuthTokenResponseDto}> {
        const hashedPassword = await hashPassword(signUp.password);
        const user: User = await this.userService.create({
            ...signUp,
            password: hashedPassword,
        });
        return new RegisterUserResponseDto(user.username, user.email);
    }

    async login(user: User): Promise<AuthTokenResponseDto> {
        this.logger.debug(`Logging in user: ${user.username}`);
        const tokens = await this.generateTokens(user);
        return tokens;
    }

    async generateTokens(user: User): Promise<AuthTokenResponseDto> {
        const payload: JwtPayload = {
            sub: user.id.toString(),
            username: user.username,
        };

        const access_token = this.jwtService.sign(payload, {
            expiresIn: AuthConstant.ACCESS_TOKEN_EXPIRATION,
        });

        const refresh_token = this.jwtService.sign(payload, {
            expiresIn: AuthConstant.REFRESH_TOKEN_EXPIRATION,
        });

        return {
            data: {
                access_token,
                refresh_token,
            },
        };
    }

    async verifyPayload(payload: JwtPayload): Promise<User> {
        const userId = payload.sub;

        try {
            this.logger.debug(`Verifying JWT payload: ${JSON.stringify(payload)}`);

            const user = await this.userService.getOne({where: {id: userId}});

            this.logger.log(`JWT verified for user: ${userId}, found: ${user.id} (${user.username})`);

            return user;
        } catch (error: any) {
            this.logger.error(`JWT verification failed for user ID: ${userId}`, error.stack);
            throw new UnauthorizedException('Invalid token payload');
        }
    }

    async validateUser(identifier: string, password: string): Promise<User> {
        let user: User;

        try {
            try {
                user = await this.userService.getOne({where: {email: identifier}});
            } catch (error) {
                user = await this.userService.getOne({where: {username: identifier}});
            }

            if (!(await checkPassword(password, user.password || ''))) {
                throw new UnauthorizedException(`Invalid credentials`);
            }
            return user;
        } catch (err: any) {
            throw new UnauthorizedException(`Invalid credentials`);
        }
    }

    async getUserProfile(user: User): Promise<User & {followerCount: number; followingCount: number}> {
        const userProfile = {...user};
        delete userProfile.password;

        if (!userProfile) {
            throw new NotFoundException('User not found');
        }

        // Get follower and following counts
        const followerCount = await this.friendService.getFollowerCount(user.id);
        const followingCount = await this.friendService.getFollowingCount(user.id);

        // Return user with counts
        return {
            ...userProfile,
            followerCount,
            followingCount,
        };
    }

    async logout(token: string): Promise<{message: string}> {
        if (token) {
            // Extract token from "Bearer TOKEN" format
            const tokenValue = token.replace('Bearer ', '');
            await this.tokenBlacklistService.blacklistToken(tokenValue);
        }
        return {message: 'Logged out successfully'};
    }
}

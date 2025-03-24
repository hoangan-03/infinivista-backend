import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';

import {User} from '@/entities/local/user.entity';
import {AuthConstant} from '@/modules/auth/constant';
import {AuthTokenResponseDto} from '@/modules/auth/dto/auth-token-response.dto';
import {RegisterUserDto} from '@/modules/auth/dto/register-user.dto';
import {RegisterUserResponseDto} from '@/modules/auth/dto/register-user-response.dto';
import {FacebookUserData} from '@/modules/auth/interfaces/facebook-user.interface';
import {GoogleUserData} from '@/modules/auth/interfaces/google-user.interface';
import {JwtPayload} from '@/modules/auth/interfaces/jwt-payload.interface';
import {UserService} from '@/modules/user/services/user.service';
import {checkPassword, hashPassword} from '@/utils/hash-password';

import {TokenBlacklistService} from './token-blacklist/token-blacklist.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,

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
        const tokens = this.generateTokens(user);
        return tokens;
    }

    generateTokens(user: User): AuthTokenResponseDto {
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
        } catch (err) {
            throw new UnauthorizedException(`Invalid credentials`);
        }
    }
    getUserProfile(user: User) {
        const userWithoutPassword = {...user};
        this.logger.log(`User profile retrieved: ${user.username}`);
        delete userWithoutPassword.password;
        return userWithoutPassword;
    }

    async logout(token: string): Promise<{message: string}> {
        if (token) {
            // Extract token from "Bearer TOKEN" format
            const tokenValue = token.replace('Bearer ', '');
            await this.tokenBlacklistService.blacklistToken(tokenValue);
        }
        return {message: 'Logged out successfully'};
    }

    async validateOrCreateFacebookUser(userData: FacebookUserData): Promise<User> {
        const {email, firstName, lastName} = userData;

        try {
            const user = await this.userService.getOne({
                where: {username: email},
            });
            return user;
        } catch (error) {
            const randomPassword =
                Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10) + 'A1@';

            const hashedPassword = await hashPassword(randomPassword);

            const newUser = await this.userService.create({
                email: email,
                password: hashedPassword,
                username: `${firstName} ${lastName}`,
            });

            return newUser;
        }
    }

    async googleLogin(user: User): Promise<AuthTokenResponseDto> {
        if (!user) {
            throw new UnauthorizedException('No user from Google login');
        }

        return this.generateTokens(user);
    }

    async validateOrCreateGoogleUser(userData: GoogleUserData): Promise<User> {
        const {email, firstName, lastName} = userData;

        try {
            const user = await this.userService.getOne({
                where: {username: email},
            });
            return user;
        } catch (error) {
            const randomPassword =
                Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10) + 'A1@';

            const hashedPassword = await hashPassword(randomPassword);

            const newUser = await this.userService.create({
                email: email,
                password: hashedPassword,
                username: `${firstName} ${lastName}`,
            });

            return newUser;
        }
    }

    async facebookLogin(user: User): Promise<AuthTokenResponseDto> {
        if (!user) {
            throw new UnauthorizedException('No user from Facebook login');
        }

        return this.generateTokens(user);
    }
}

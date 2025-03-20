import {Injectable, InternalServerErrorException, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {Response} from 'express';

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

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService
    ) {}

    async register(signUp: RegisterUserDto, response: Response): Promise<RegisterUserResponseDto> {
        try {
            const hashedPassword = await hashPassword(signUp.password);
            const user: User = await this.userService.create({
                ...signUp,
                password: hashedPassword,
            });

            const tokens = this.generateTokens(user);
            this.setAuthCookies(response, tokens);
            return new RegisterUserResponseDto(user.username, user.email);
        } catch (error: any) {
            throw new InternalServerErrorException(error.message || 'Registration failed.');
        }
    }

    async login(user: User, response: Response): Promise<AuthTokenResponseDto> {
        const tokens = this.generateTokens(user);
        // this.setAuthCookies(response, tokens);
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
    setAuthCookies(response: Response, tokens: AuthTokenResponseDto): void {
        // response.cookie('token', tokens.data.access_token, {
        //     httpOnly: true,
        //     signed: true,
        //     sameSite: 'strict',
        //     secure: process.env.NODE_ENV === 'production',
        // });
        // response.setHeader('Authorization', `Bearer ${tokens.data.access_token}`);
    }

    async verifyPayload(payload: JwtPayload): Promise<User> {
        const userId = payload.sub;

        try {
            return await this.userService.getOne({where: {id: userId}});
        } catch (error) {
            throw new UnauthorizedException(`There isn't any user with ID: ${payload.sub}`);
        }
    }

    async validateUser(username: string, password: string): Promise<User> {
        let user: User;

        try {
            user = await this.userService.getOne({where: {username}});

            if (!(await checkPassword(password, user.password || ''))) {
                throw new UnauthorizedException(`Invalid credentials`);
            }
            return user;
        } catch (err) {
            throw new UnauthorizedException(`Invalid credentials`);
        }
    }

    getUserProfile(user: User): Omit<User, 'password'> {
        const userWithoutPassword = {...user};
        delete userWithoutPassword.password;
        return userWithoutPassword;
    }

    logout(response: Response): {message: string} {
        // Clear authentication cookies
        response.clearCookie('token', {
            httpOnly: true,
            signed: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
        });

        // Remove the authorization header
        response.removeHeader('Authorization');

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

    async googleLogin(user: User, response: Response): Promise<AuthTokenResponseDto> {
        if (!user) {
            throw new UnauthorizedException('No user from Google login');
        }

        const tokens = this.generateTokens(user);
        this.setAuthCookies(response, tokens);

        return tokens;
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

    async facebookLogin(user: User, response: Response): Promise<AuthTokenResponseDto> {
        if (!user) {
            throw new UnauthorizedException('No user from Facebook login');
        }

        const tokens = this.generateTokens(user);
        this.setAuthCookies(response, tokens);

        return tokens;
    }
}

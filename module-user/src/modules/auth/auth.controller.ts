import {Controller, UnauthorizedException} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';

import {User} from '@/entities/local/user.entity';
import {AuthService} from '@/modules/auth/auth.service';
import {AuthTokenResponseDto} from '@/modules/auth/dto/auth-token-response.dto';
import {RegisterUserDto} from '@/modules/auth/dto/register-user.dto';
import {RegisterUserResponseDto} from '@/modules/auth/dto/register-user-response.dto';
import {FacebookUserData} from '@/modules/auth/interfaces/facebook-user.interface';
import {GoogleUserData} from '@/modules/auth/interfaces/google-user.interface';

import {JwtPayload} from './interfaces/jwt-payload.interface';
import {TokenBlacklistService} from './token-blacklist/token-blacklist.service';

@Controller()
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly tokenBlacklistService: TokenBlacklistService
    ) {}

    @MessagePattern('RegisterAuthCommand')
    async register(payload: {signUp: RegisterUserDto}): Promise<RegisterUserResponseDto> {
        const result = await this.authService.register(payload.signUp);
        return result;
    }

    @MessagePattern('LoginAuthCommand')
    async login(payload: {user: User}): Promise<AuthTokenResponseDto> {
        if (!payload.user) {
            throw new UnauthorizedException('Authentication failed');
        }
        const result = await this.authService.login(payload.user);
        return result;
    }

    @MessagePattern('GetProfileAuthCommand')
    async me(payload: {user: User}): Promise<User> {
        return this.authService.getUserProfile(payload.user);
    }

    @MessagePattern('LogoutAuthCommand')
    async logout(payload: {token: string}): Promise<{message: string}> {
        return this.authService.logout(payload.token);
    }

    // @MessagePattern('GoogleAuthCommand')
    // async googleAuth(payload: {userData: GoogleUserData}): Promise<AuthTokenResponseDto> {
    //     const user = await this.authService.validateOrCreateGoogleUser(payload.userData);
    //     return this.authService.googleLogin(user);
    // }

    // @MessagePattern('FacebookAuthCommand')
    // async facebookAuth(payload: {userData: FacebookUserData}): Promise<AuthTokenResponseDto> {
    //     const user = await this.authService.validateOrCreateFacebookUser(payload.userData);
    //     return this.authService.facebookLogin(user);
    // }

    @MessagePattern('ValidateUserAuthCommand')
    async validateUser(payload: {identifier: string; password: string}): Promise<User> {
        return this.authService.validateUser(payload.identifier, payload.password);
    }

    @MessagePattern('CheckTokenBlacklistCommand')
    async isTokenBlacklisted(payload: {token: string}): Promise<boolean> {
        // Extract just the token part if it has the Bearer prefix
        const tokenValue = payload.token?.replace('Bearer ', '');
        return this.tokenBlacklistService.isBlacklisted(tokenValue);
    }

    @MessagePattern('VerifyJwtAuthCommand')
    async verifyJwt(payload: {jwt: JwtPayload}): Promise<User> {
        return this.authService.verifyPayload(payload.jwt);
    }
}

import {UnauthorizedException} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';
import {Response} from 'express';

import {User} from '@/entities/local/user.entity';
import {AuthService} from '@/modules/auth/auth.service';
import {AuthTokenResponseDto} from '@/modules/auth/dto/auth-token-response.dto';
import {RegisterUserDto} from '@/modules/auth/dto/register-user.dto';
import {RegisterUserResponseDto} from '@/modules/auth/dto/register-user-response.dto';
import {FacebookUserData} from '@/modules/auth/interfaces/facebook-user.interface';
import {GoogleUserData} from '@/modules/auth/interfaces/google-user.interface';
import {JwtPayload} from './interfaces/jwt-payload.interface';

export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @MessagePattern('RegisterAuthCommand')
    async register(payload: {signUp: RegisterUserDto; response: Response}): Promise<RegisterUserResponseDto> {
        return this.authService.register(payload.signUp, payload.response);
    }

    @MessagePattern('LoginAuthCommand')
    async login(payload: {user: User; response: Response}): Promise<AuthTokenResponseDto> {
        if (!payload.user) {
            throw new UnauthorizedException('Authentication failed');
        }
        return this.authService.login(payload.user, payload.response);
    }

    @MessagePattern('GetProfileAuthCommand')
    async me(payload: {user: User}): Promise<User> {
        return this.authService.getUserProfile(payload.user);
    }

    @MessagePattern('LogoutAuthCommand')
    async logout(payload: {response: Response}): Promise<{message: string}> {
        return this.authService.logout(payload.response);
    }

    @MessagePattern('GoogleAuthCommand')
    async googleAuth(payload: {userData: GoogleUserData; response: Response}): Promise<AuthTokenResponseDto> {
        const user = await this.authService.validateOrCreateGoogleUser(payload.userData);
        return this.authService.googleLogin(user, payload.response);
    }

    @MessagePattern('FacebookAuthCommand')
    async facebookAuth(payload: {userData: FacebookUserData; response: Response}): Promise<AuthTokenResponseDto> {
        const user = await this.authService.validateOrCreateFacebookUser(payload.userData);
        return this.authService.facebookLogin(user, payload.response);
    }

    @MessagePattern('ValidateUserAuthCommand')
    async validateUser(payload: {username: string; password: string}): Promise<User> {
        return this.authService.validateUser(payload.username, payload.password);
    }

    @MessagePattern('VerifyJwtAuthCommand')
    async verifyJwt(payload: {jwt: JwtPayload}): Promise<User> {
        return this.authService.verifyPayload(payload.jwt);
    }
}

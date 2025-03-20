import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Post,
    Res,
    UnauthorizedException,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {Response} from 'express';
import {lastValueFrom} from 'rxjs';

import {CurrentUser} from '@/decorators/user.decorator';
import {AuthTokenResponseDto} from '@/dtos/user-module/auth-token-response.dto';
import {LoginUserDTO} from '@/dtos/user-module/login-user.dto';
import {RegisterUserDto} from '@/dtos/user-module/register-user.dto';
import {RegisterUserResponseDto} from '@/dtos/user-module/register-user-response.dto';
import {User} from '@/entities/user-module/user.entity';
import {FacebookAuthGuard} from '@/guards/facebook-auth.guard';
import {GoogleAuthGuard} from '@/guards/google-auth.guard';
import {JWTAuthGuard} from '@/guards/jwt-auth.guard';
import {LocalAuthGuard} from '@/guards/local-auth.guard';
import {SessionAuthGuard} from '@/guards/session-auth.guard';
import {TokenInterceptor} from '@/interceptors/token.interceptor';

@ApiTags('Auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
    constructor(@Inject('USER_SERVICE') private userClient: ClientProxy) {}

    @Post('register')
    @UseInterceptors(TokenInterceptor)
    @ApiOperation({summary: 'Register a new user'})
    @ApiBody({type: RegisterUserDto})
    @ApiResponse({
        status: 201,
        description: 'User successfully registered',
        type: RegisterUserResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request - Invalid input data',
    })
    async register(
        @Body() signUp: RegisterUserDto,
        @Res({passthrough: true}) response: Response
    ): Promise<RegisterUserResponseDto> {
        return await lastValueFrom(this.userClient.send('RegisterAuthCommand', {signUp, response}));
    }

    @Post('login')
    @UseGuards(LocalAuthGuard)
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(TokenInterceptor)
    @ApiOperation({summary: 'Login with email/username and password'})
    @ApiBody({type: LoginUserDTO})
    @ApiResponse({
        status: 200,
        description: 'User successfully logged in',
        type: AuthTokenResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid credentials',
    })
    async login(
        @CurrentUser() user: User,
        @Res({passthrough: true}) response: Response
    ): Promise<AuthTokenResponseDto> {
        if (!user) {
            throw new UnauthorizedException('Authentication failed');
        }

        return await lastValueFrom(this.userClient.send('LoginAuthCommand', {user, response}));
    }

    @Get('me')
    @UseGuards(SessionAuthGuard, JWTAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({summary: 'Get current user profile'})
    @ApiResponse({
        status: 200,
        description: 'Returns the current authenticated user',
        type: User,
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token',
    })
    async me(@CurrentUser() user: User): Promise<User> {
        return await lastValueFrom(this.userClient.send('GetProfileAuthCommand', {user}));
    }

    @Post('logout')
    @UseGuards(JWTAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({summary: 'Logout the current user'})
    @ApiResponse({
        status: 200,
        description: 'User successfully logged out',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Logged out successfully',
                },
            },
        },
    })
    async logout(@Res({passthrough: true}) response: Response): Promise<{message: string}> {
        return await lastValueFrom(this.userClient.send('LogoutAuthCommand', {response}));
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    @ApiOperation({summary: 'Handle Google OAuth callback'})
    @ApiResponse({
        status: 200,
        description: 'User successfully logged in with Google',
        type: AuthTokenResponseDto,
    })
    async googleAuthCallback(
        @CurrentUser() userData: any,
        @Res({passthrough: true}) response: Response
    ): Promise<AuthTokenResponseDto> {
        return await lastValueFrom(this.userClient.send('GoogleAuthCommand', {userData, response}));
    }

    @Get('facebook/callback')
    @UseGuards(FacebookAuthGuard)
    @ApiOperation({summary: 'Handle Facebook OAuth callback'})
    @ApiResponse({
        status: 200,
        description: 'User successfully logged in with Facebook',
        type: AuthTokenResponseDto,
    })
    async facebookAuthCallback(
        @CurrentUser() userData: any,
        @Res({passthrough: true}) response: Response
    ): Promise<AuthTokenResponseDto> {
        return await lastValueFrom(this.userClient.send('FacebookAuthCommand', {userData, response}));
    }
}

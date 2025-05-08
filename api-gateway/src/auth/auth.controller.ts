import {
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Post,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {Response} from 'express';
import {lastValueFrom} from 'rxjs';

import {AuthTokenResponseDto} from '@/auth/dtos/auth-token-response.dto';
import {LoginUserDTO} from '@/auth/dtos/login-user.dto';
import {RegisterUserDto} from '@/auth/dtos/register-user.dto';
import {RegisterUserResponseDto} from '@/auth/dtos/register-user-response.dto';
import {CurrentUser} from '@/decorators/user.decorator';
import {User} from '@/entities/user-module/local/user.entity';
// import {FacebookAuthGuard} from '@/guards/facebook-auth.guard';
// import {GoogleAuthGuard} from '@/guards/google-auth.guard';
import {JWTAuthGuard} from '@/guards/jwt-auth.guard';
import {JwtBlacklistGuard} from '@/guards/jwt-blacklist.guard';
import {LocalAuthGuard} from '@/guards/local-auth.guard';
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
    async register(@Body() signUp: RegisterUserDto): Promise<RegisterUserResponseDto> {
        return await lastValueFrom(this.userClient.send('RegisterAuthCommand', {signUp}));
    }

    @Post('login')
    @UseGuards(JwtBlacklistGuard, LocalAuthGuard)
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
    async login(@CurrentUser() user: User): Promise<AuthTokenResponseDto> {
        if (!user) {
            throw new UnauthorizedException('Authentication failed');
        }

        return await lastValueFrom(this.userClient.send('LoginAuthCommand', {user}));
    }

    @Get('me')
    @UseGuards(JwtBlacklistGuard, JWTAuthGuard)
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
    @UseGuards(JwtBlacklistGuard, JWTAuthGuard)
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
    async logout(@Req() request: Request, @Res({passthrough: true}) response: Response): Promise<{message: string}> {
        response.clearCookie('connect.sid');
        response.clearCookie('token');

        const token = (request.headers as any).authorization;

        return await lastValueFrom(this.userClient.send('LogoutAuthCommand', {token}));
    }
}

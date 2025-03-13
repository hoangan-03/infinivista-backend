import {Body, Controller, Get, HttpCode, HttpStatus, Inject, Post} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {lastValueFrom} from 'rxjs';

import {AuthUser} from '@/decorators/user.decorator';
import {AuthTokenResponseDto} from '@/dtos/user-module/auth-token-response.dto';
import {LoginUserDTO} from '@/dtos/user-module/login-user.dto';
import {RegisterUserDto} from '@/dtos/user-module/register-user.dto';
import {RegisterUserResponseDto} from '@/dtos/user-module/register-user-response.dto';
import {User} from '@/entities/user-module/user.entity';
// import {JWTAuthGuard} from '@/modules/auth/guards/jwt-auth.guard';
// import {LocalAuthGuard} from '@/modules/auth/guards/local-auth.guard';
// import {SessionAuthGuard} from '@/modules/auth/guards/session-auth.guard';
// import {TokenInterceptor} from '@/modules/auth/interceptors/token.interceptor';

@ApiTags('Auth')
@Controller('auth')
// @UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
    constructor(@Inject('USER_SERVICE') private userClient: ClientProxy) {}

    @Post('register')
    // @UseInterceptors(TokenInterceptor)
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
    // @UseGuards(LocalAuthGuard)
    @HttpCode(HttpStatus.OK)
    // @UseInterceptors(TokenInterceptor)
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
    async login(@Body() credentials: LoginUserDTO): Promise<AuthTokenResponseDto> {
        return await lastValueFrom(this.userClient.send('LoginAuthCommand', {credentials}));
    }

    @Get('/me')
    // @UseGuards(SessionAuthGuard, JWTAuthGuard)
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
    async me(@AuthUser() user: User): Promise<User> {
        return await lastValueFrom(this.userClient.send('GetProfileAuthCommand', {user}));
    }
}

import {MessagePattern} from '@nestjs/microservices';

import {User} from '@/entities/user.entity';
import {AuthService} from '@/modules/auth/auth.service';
import {AuthTokenResponseDto} from '@/modules/auth/dto/auth-token-response.dto';
import {LoginUserDTO} from '@/modules/auth/dto/login-user.dto';
import {RegisterUserDto} from '@/modules/auth/dto/register-user.dto';
import {RegisterUserResponseDto} from '@/modules/auth/dto/register-user-response.dto';

// @Controller('auth')
// @UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    // @UseInterceptors(TokenInterceptor)
    @MessagePattern('RegisterAuthCommand')
    async register(payload: {signUp: RegisterUserDto}): Promise<RegisterUserResponseDto> {
        const user = await this.authService.register(payload.signUp);

        // Create and attach a token to the response
        // manually instead of using the interceptor
        // const token = this.authService.signToken(user);

        // Transform to DTO before returning
        return new RegisterUserResponseDto(user.email, user.username);
    }

    // @UseGuards(LocalAuthGuard)
    // @UseInterceptors(TokenInterceptor)
    @MessagePattern('LoginAuthCommand')
    async login(payload: {credentials: LoginUserDTO}): Promise<AuthTokenResponseDto> {
        return this.authService.login(payload.credentials.email, payload.credentials.password);
    }

    // @UseGuards(SessionAuthGuard, JWTAuthGuard)
    @MessagePattern('GetProfileAuthCommand')
    async me(payload: {user: User}): Promise<User> {
        return payload.user;
    }
}

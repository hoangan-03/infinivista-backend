import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

import { AuthUser } from '@/modules/user/decorators/user.decorator';
import { User } from '@/modules/user/entities/user.entity';
import { AuthService } from '@/modules/auth/auth.service';
import { SignUp } from '@/modules/auth/dto/sign-up.dto';
import { JWTAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { LocalAuthGuard } from '@/modules/auth/guards/local-auth.guard';
import { SessionAuthGuard } from '@/modules/auth/guards/session-auth.guard';
import { TokenInterceptor } from '@/modules/auth/interceptors/token.interceptor';
import { AuthResponse } from './interfaces/response.interface';

@ApiTags('Authentication')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(TokenInterceptor)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: SignUp })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered',
    type: User 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid input data' 
  })
  register(@Body() signUp: SignUp): Promise<User> {
    return this.authService.register(signUp);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(TokenInterceptor)
  @ApiOperation({ summary: 'Login with credentials' })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully logged in',
    type: User 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid credentials' 
  })
  async login(@Body() credentials: { email: string; password: string }): Promise<AuthResponse> {
    return this.authService.login(credentials.email, credentials.password);
  }

  @Get('/me')
  @UseGuards(SessionAuthGuard, JWTAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the current authenticated user',
    type: User 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing token' 
  })
  me(@AuthUser() user: User): User {
    return user;
  }
}
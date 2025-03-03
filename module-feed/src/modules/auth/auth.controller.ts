import {
  Controller,
  Get,
  UseGuards,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthUser } from './decorators/auth-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Token verification endpoint
   * This is mainly for testing/debugging purposes
   */
  @Get('verify')
  @ApiOperation({ summary: 'Verify a JWT token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token is valid, returns decoded payload'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid or expired token' 
  })
  async verifyToken(@Headers('authorization') authHeader: string): Promise<JwtPayload> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    return this.authService.getUserFromToken(token);
  }

  /**
   * Get current user from token
   * Protected route that requires valid JWT
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user from token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns user info from decoded JWT token'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing token' 
  })
  getCurrentUser(@AuthUser() user: JwtPayload): JwtPayload {
    return user;
  }
}
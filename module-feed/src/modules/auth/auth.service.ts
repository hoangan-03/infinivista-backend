import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Verify JWT token
   * This is used internally by the JWT strategy
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Validate JWT payload
   * This checks if the payload has the required fields
   */
  validatePayload(payload: JwtPayload): boolean {
    return !!payload && !!payload.sub;  // Changed from payload.id to payload.sub
  }

  /**
   * Extract user info from token
   * This can be used for testing or debugging purposes
   */
  async getUserFromToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.verifyToken(token);
      if (!this.validatePayload(payload)) {
        throw new UnauthorizedException('Invalid token payload');
      }
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
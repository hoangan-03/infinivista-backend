import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "@/entities/user.entity";
import { RegisterUserDto } from "@/modules/auth/dto/register-user.dto";
import { JwtPayload } from "@/modules/auth/interfaces/jwt-payload.interface";
import { UserService } from "@/modules/user/services/user.service";
import { AuthTokenResponseDto } from "./dto/auth-token-response.dto";
import { RegisterUserResponseDto as RegisterUserResponseDto } from "./dto/register-user-response.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {}

  async register(signUp: RegisterUserDto): Promise<RegisterUserResponseDto> {
    const user = await this.userService.create(signUp);
    delete user.password;

    const response = new RegisterUserResponseDto(user.email, user.username);

    return response;
  }

  private readonly ACCESS_TOKEN_EXPIRATION = 60;
  private readonly REFRESH_TOKEN_EXPIRATION = 120;

  async login(email: string, password: string): Promise<AuthTokenResponseDto> {
    let user: User;
    try {
      user = await this.userService.findOne({ where: { email } });
    } catch (err) {
      throw new UnauthorizedException(
        `There isn't any user with email: ${email}`
      );
    }

    if (!(await user.checkPassword(password))) {
      throw new UnauthorizedException(
        `Wrong password for user with email: ${email}`
      );
    }

    return this.generateTokens(user);
  }

  private generateTokens(user: User): AuthTokenResponseDto {
    const payload = { id: user.id };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRATION,
    });

    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: this.REFRESH_TOKEN_EXPIRATION,
    });

    return {
      data: {
        access_token,
        expires_in: this.ACCESS_TOKEN_EXPIRATION,
        refresh_token,
      },
    };
  }

  async verifyPayload(payload: JwtPayload): Promise<User> {
    let user: User;

    try {
      user = await this.userService.findOne({ where: { email: payload.sub } });
    } catch (error) {
      throw new UnauthorizedException(
        `There isn't any user with email: ${payload.sub}`
      );
    }

    return user;
  }

  signToken(user: User): string {
    const payload = {
      sub: user.email,
    };

    return this.jwtService.sign(payload);
  }
}

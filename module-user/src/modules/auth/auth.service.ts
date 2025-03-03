import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "@/entities/user.entity";
import { RegisterUserDto } from "@/modules/auth/dto/register-user.dto";
import { JwtPayload } from "@/modules/auth/interfaces/jwt-payload.interface";
import { UserService } from "@/modules/user/services/user.service";
import { AuthTokenResponseDto } from "@/modules/auth/dto/auth-token-response.dto";
import { RegisterUserResponseDto as RegisterUserResponseDto } from "@/modules/auth/dto/register-user-response.dto";
import { AuthConstant } from "@/modules/auth/constant";
import { BeforeInsert, BeforeUpdate } from "typeorm";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async checkPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return hashedPassword
      ? await bcrypt.compare(plainPassword, hashedPassword)
      : false;
  }

  // module-user/src/modules/auth/auth.service.ts
async register(signUp: RegisterUserDto): Promise<User> {
  try {
    const hashedPassword = await this.hashPassword(signUp.password);
    const user = await this.userService.create({
      ...signUp,
      password: hashedPassword,
    });
    delete user.password;
    return user; // Return the full user object with ID
  } catch (error) {
    if (error instanceof Error) {
      if ("code" in error && (error as any).code === "23505") {
        throw new BadRequestException("Email or username already exists.");
      }
      throw new InternalServerErrorException(
        error.message || "Registration failed."
      );
    }
    throw new InternalServerErrorException("An unexpected error occurred.");
  }
}

  async login(email: string, password: string): Promise<AuthTokenResponseDto> {
    let user: User;

    try {
      user = await this.userService.getOne({ where: { email } });
    } catch (err) {
      throw new UnauthorizedException(`Invalid credentials`);
    }

    if (!(await this.checkPassword(password, user.password || ""))) {
      throw new UnauthorizedException(`Invalid credentials`);
    }

    return this.generateTokens(user);
  }

  private generateTokens(user: User): AuthTokenResponseDto {
    const payload: JwtPayload = {
      sub: user.id.toString(),
      email: user.email,
      username: user.username,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: AuthConstant.ACCESS_TOKEN_EXPIRATION,
    });

    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: AuthConstant.REFRESH_TOKEN_EXPIRATION,
    });

    return {
      data: {
        access_token,
        expires_in: AuthConstant.ACCESS_TOKEN_EXPIRATION,
        refresh_token,
      },
    };
  }

  async verifyPayload(payload: JwtPayload): Promise<User> {
    let user: User;

    try {
      user = await this.userService.getOne({
        where: { id: payload.sub },
      });
    } catch (error) {
      throw new UnauthorizedException(
        `There isn't any user with ID: ${payload.sub}`
      );
    }

    return user;
  }

  // module-user/src/modules/auth/auth.service.ts
  async signToken(user: User | any): Promise<string> {
    // First check if we got a complete user object with ID
    if (!user) {
      throw new UnauthorizedException("Invalid user data: Missing user object");
    }

    // If we have a RegisterUserResponseDto instead of a User object
    // if (user.email && user.username && !user.id) {
    //   // Try to fetch the complete user
    //   const foundUser = await this.userService.getOne({
    //     where: { email: user.email },
    //   });

    //   // Use the found user's ID
    //   const payload: JwtPayload = {
    //     sub: foundUser.id.toString(),
    //     email: foundUser.email || "",
    //     username: foundUser.username || "",
    //     iat: Date.now(),
    //     exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    //   };

    //   return this.jwtService.sign(payload);
    // }

    // Normal case with user.id
    if (user.id === undefined || user.id === null) {
      throw new UnauthorizedException("Invalid user data: Missing user ID");
    }

    const payload: JwtPayload = {
      sub: user.id.toString(),
      email: user.email || "",
      username: user.username || "",
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    };

    return this.jwtService.sign(payload);
  }
}

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, JwtFromRequestFunction, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { AuthService } from "../auth.service";

const extractJwtFromCookie: JwtFromRequestFunction = (request) => {
  return request.signedCookies["token"]!;
};
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    private configService: ConfigService,
    private authService: AuthService
  ) {
    const jwtSecret = configService.getOrThrow<string>("JWT_SECRET");

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractJwtFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      algorithms: ["HS384"],
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException("Invalid token payload");
    }

    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
    };
  }
}

import { Controller, Post, Body, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
// import { UserService } from './services/user.service';
import { CreateUser } from "./dto/create-user.dto";
import { LoginUser } from "./dto/login-user.dto";
import { User } from "@/modules/user/entities/user.entity";
import { UserService } from "./services/user.service";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly userService: UserService) {}
  @Get()
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({ status: 200, description: "Return all users", type: [User] })
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }
}

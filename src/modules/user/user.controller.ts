import { Controller, Post, Body, Get, Param, Patch } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
// import { UserService } from './services/user.service';

import { LoginUserDTO } from "../auth/dto/login-user.dto";
import { User } from "@/modules/user/entities/user.entity";
import { UserService } from "./services/user.service";
import { UpdateUserDto } from "./dto/update-user.dto";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly userService: UserService) {}
  @Get()
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({ status: 200, description: "Return all users", type: [User] })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
  })
  async getList(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({ status: 200, description: "Return user by ID", type: User })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Invalid input data",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
  })
  @ApiResponse({
    status: 404,
    description: "Not Found - User not found with the provided ID",
  })
  async getById(@Param("id") id: string): Promise<User> {
    return this.userService.findOne({ where: { id } });
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update user by ID" })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: "Return updated user", type: User })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Invalid input data",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing token",
  })
  @ApiResponse({
    status: 404,
    description: "Not Found - User not found with the provided ID",
  })
  async update(@Param("id") id: string, @Body() user: UpdateUserDto): Promise<User> {
    return this.userService.update(id, user);
  }
}

import { Controller, Post, Body, Get, Param, Patch, Put } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
import { User } from "@/entities/user.entity";
import { UserService } from "@/modules/user/services/user.service";
import { UpdateUserDto } from "@/modules/user/dto/update-user.dto";
import { SecurityAnswer } from "@/entities/security-answer.entity";
import { Setting } from "@/entities/setting.entity";
import { SettingType } from "@/modules/user/enums/setting.enum";

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
    return this.userService.getAll();
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
    return this.userService.getOne({ where: { id } });
  }

  @Patch(":id")
  @ApiOperation({ summary: 'Update user' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: "Return updated user", type: User })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid credentials",
  })
  @ApiResponse({
    status: 404,
    description: "Not Found - User not found with the provided ID",
  })
  async update(
    @Param("id") id: string,
    @Body() user: UpdateUserDto
  ): Promise<User> {
    return this.userService.updateProfile(id, user);
  }

  @Put(":id/profile-picture")
  @ApiOperation({ summary: "Update user profile picture" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        imageUrl: {
          type: "string",
          example: "https://example.com/image.jpg",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Profile picture updated",
    type: User,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid credentials",
  })
  @ApiResponse({
    status: 404,
    description: "Not Found - User not found with the provided ID",
  })
  async updateProfilePicture(
    @Param("id") id: string,
    @Body("imageUrl") imageUrl: string
  ): Promise<User> {
    return this.userService.updateProfilePicture(id, imageUrl);
  }

  @Put(":id/cover-photo")
  @ApiOperation({ summary: "Update user cover photo" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        imageUrl: {
          type: "string",
          example: "https://example.com/cover.jpg",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Cover photo updated", type: User })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid credentials",
  })
  @ApiResponse({
    status: 404,
    description: "Not Found - User not found with the provided ID",
  })
  async updateCoverPhoto(
    @Param("id") id: string,
    @Body("imageUrl") imageUrl: string
  ): Promise<User> {
    return this.userService.updateCoverPhoto(id, imageUrl);
  }

  @Put(":id/settings")
  @ApiOperation({ summary: "Update user settings" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: Object.values(SettingType),
        },
        value: {
          type: "string",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Settings updated", type: Setting })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid credentials",
  })
  @ApiResponse({
    status: 404,
    description: "Not Found - User not found with the provided ID",
  })
  async updateSettings(
    @Param("id") id: string,
    @Body("type") type: SettingType,
    @Body("value") value: string
  ): Promise<Setting> {
    return this.userService.updateUserSettings(id, type, value);
  }

  @Post(":id/security-questions")
  @ApiOperation({ summary: "Set user security questions" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        answers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              questionId: { type: "string" },
              answer: { type: "string" },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Security questions set",
    type: [SecurityAnswer],
  })
  async setSecurityQuestions(
    @Param("id") id: string,
    @Body("answers") answers: { questionId: string; answer: string }[]
  ): Promise<SecurityAnswer[]> {
    return this.userService.setSecurityQuestions(id, answers);
  }

  @Put(":id/online-status")
  @ApiOperation({ summary: "Toggle user online status" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        isOnline: {
          type: "boolean",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Online status updated",
    type: User,
  })
  async toggleOnlineStatus(
    @Param("id") id: string,
    @Body("isOnline") isOnline: boolean
  ): Promise<User> {
    return this.userService.toggleOnlineStatus(id, isOnline);
  }

  @Put(":id/suspend")
  @ApiOperation({ summary: "Suspend/unsuspend user" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        suspended: {
          type: "boolean",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "User suspension status updated",
    type: User,
  })
  async suspendUser(
    @Param("id") id: string,
    @Body("suspended") suspended: boolean
  ): Promise<User> {
    return this.userService.suspendUser(id, suspended);
  }

  @Get(":id/full-profile")
  @ApiOperation({
    summary:
      "Get user's full profile including settings and security questions",
  })
  @ApiResponse({ status: 200, description: "Full user profile", type: User })
  async getFullProfile(@Param("id") id: string): Promise<User> {
    return this.userService.getUserWithFullProfile(id);
  }
}

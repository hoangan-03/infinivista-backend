import { FriendRequest } from "@/entities/friend-request.entity";
import { Friend } from "@/entities/friend.entity";
import { User } from "@/entities/user.entity";
import { JWTAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { Controller, Post, UseGuards, Param, Put, Body, Delete, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthUser } from "../decorators/user.decorator";
import { FriendService } from "../services/friend.service";

@ApiTags('friends')
@Controller('users/friends')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Post('request/:recipientId')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Send friend request' })
  async sendFriendRequest(
    @AuthUser() user: User,
    @Param('recipientId') recipientId: string
  ): Promise<FriendRequest> {
    return this.friendService.sendFriendRequest(user.id, recipientId);
  }

  @Put('request/:requestId')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Accept or decline friend request' })
  async respondToRequest(
    @AuthUser() user: User,
    @Param('requestId') requestId: string,
    @Body('accept') accept: boolean
  ): Promise<void> {
    return this.friendService.respondToFriendRequest(requestId, user.id, accept);
  }

  @Delete(':friendId')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Remove friend' })
  async removeFriend(
    @AuthUser() user: User,
    @Param('friendId') friendId: string
  ): Promise<void> {
    return this.friendService.removeFriend(user.id, friendId);
  }

  @Post('block/:userId')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Block user' })
  async blockUser(
    @AuthUser() user: User,
    @Param('userId') blockedUserId: string
  ): Promise<void> {
    return this.friendService.blockUser(user.id, blockedUserId);
  }

  @Get()
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Get friends list' })
  async getFriends(@AuthUser() user: User): Promise<User[]> {
    return this.friendService.getFriends(user.id);
  }

  @Get('requests')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Get pending friend requests' })
  async getFriendRequests(@AuthUser() user: User): Promise<FriendRequest[]> {
    return this.friendService.getFriendRequests(user.id);
  }

  @Put(':friendId/group')
  @UseGuards(JWTAuthGuard)
  @ApiOperation({ summary: 'Update friend group' })
  async updateFriendGroup(
    @AuthUser() user: User,
    @Param('friendId') friendId: string,
    @Body('group') group: string
  ): Promise<Friend> {
    return this.friendService.updateFriendGroup(user.id, friendId, group);
  }
}
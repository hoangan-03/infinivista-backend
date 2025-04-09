// import {Body, Controller, Delete, Get, Inject, Param, Post, Put, UseGuards} from '@nestjs/common';
// import {ClientProxy} from '@nestjs/microservices';
// import {ApiBearerAuth, ApiOperation, ApiTags} from '@nestjs/swagger';
// import {lastValueFrom} from 'rxjs';

// import {FriendRequest} from '@/entities/user-module/local/friend-request.entity';
// import {User} from '@/entities/user-module/local/user.entity';
// import {JWTAuthGuard} from '@/guards/jwt-auth.guard';
// import {JwtBlacklistGuard} from '@/guards/jwt-blacklist.guard';

// import {CurrentUser} from '../decorators/user.decorator';

// @ApiTags('Friends')
// @Controller('users/friends')
// @ApiBearerAuth()
// @UseGuards(JwtBlacklistGuard, JWTAuthGuard)
// export class FriendController {
//     constructor(@Inject('FRIEND_SERVICE') private friendClient: ClientProxy) {}

//     @Get()
//     @ApiOperation({summary: 'Get list of friends for current user'})
//     async getFriends(@CurrentUser() user: User): Promise<User[]> {
//         console.log('Fetching friends for user:', user.id);
//         return await lastValueFrom(this.friendClient.send('GetFriendsUserCommand', {userId: user.id}));
//     }

//     @Get('requests')
//     @ApiOperation({summary: 'Get all friend requests'})
//     async getFriendRequests(@CurrentUser() user: User): Promise<FriendRequest[]> {
//         return await lastValueFrom(this.friendClient.send('GetFriendRequestsUserCommand', {userId: user.id}));
//     }

//     @Delete(':friendId')
//     @ApiOperation({summary: 'Remove friend'})
//     async removeFriend(@CurrentUser() user: User, @Param('friendId') friendId: string): Promise<void> {
//         return await lastValueFrom(this.friendClient.send('RemoveFriendUserCommand', {userId: user.id, friendId}));
//     }

//     @Post('request/:recipientId')
//     @ApiOperation({summary: 'Send friend request'})
//     async sendFriendRequest(
//         @CurrentUser() user: User,
//         @Param('recipientId') recipientId: string
//     ): Promise<FriendRequest> {
//         return await lastValueFrom(
//             this.friendClient.send('SendFriendRequestUserCommand', {senderId: user.id, recipientId})
//         );
//     }

//     @Put('request/:requestId')
//     @ApiOperation({summary: 'Accept or decline friend request'})
//     async respondToRequest(
//         @CurrentUser() user: User,
//         @Param('requestId') requestId: string,
//         @Body('accept') accept: boolean
//     ): Promise<void> {
//         return await lastValueFrom(
//             this.friendClient.send('RespondToFriendRequestUserCommand', {requestId, userId: user.id, accept})
//         );
//     }
// }

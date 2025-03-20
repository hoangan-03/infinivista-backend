// import {Body, Controller, Delete, Get, Inject, Param, Post, Put, UseGuards} from '@nestjs/common';
// import {ClientProxy} from '@nestjs/microservices';
// import {ApiOperation, ApiTags} from '@nestjs/swagger';
// import {lastValueFrom} from 'rxjs';

// import {Friend} from '@/entities/user-module/friend.entity';
// import {FriendRequest} from '@/entities/user-module/friend-request.entity';
// import {User} from '@/entities/user-module/user.entity';
// import {JWTAuthGuard} from '@/guards/jwt-auth.guard';

// import {AuthUser} from '../decorators/user.decorator';

// @ApiTags('Friends')
// @Controller('users/friends')
// @UseGuards(JWTAuthGuard)
// export class FriendController {
//     constructor(@Inject('USER_SERVICE') private userClient: ClientProxy) {}

//     @Post('request/:recipientId')
//     @ApiOperation({summary: 'Send friend request'})
//     async sendFriendRequest(@AuthUser() user: User, @Param('recipientId') recipientId: string): Promise<FriendRequest> {
//         return await lastValueFrom(
//             this.userClient.send<FriendRequest>('SendRequestFriendCommand', {userId: user.id, recipientId})
//         );
//     }

//     @Put('request/:requestId')
//     @ApiOperation({summary: 'Accept or decline friend request'})
//     async respondToRequest(
//         @AuthUser() user: User,
//         @Param('requestId') requestId: string,
//         @Body('accept') accept: boolean
//     ): Promise<void> {
//         return await lastValueFrom(
//             this.userClient.send<void>('RespondToRequestFriendCommand', {userId: user.id, requestId, accept})
//         );
//     }

//     @Delete(':friendId')
//     @ApiOperation({summary: 'Remove friend'})
//     async removeFriend(@AuthUser() user: User, @Param('friendId') friendId: string): Promise<void> {
//         return await lastValueFrom(this.userClient.send<void>('RemoveFriendCommand', {userId: user.id, friendId}));
//     }

//     @Post('block/:userId')
//     @ApiOperation({summary: 'Block user'})
//     async blockUser(@AuthUser() user: User, @Param('userId') blockedUserId: string): Promise<void> {
//         return await lastValueFrom(this.userClient.send<void>('BlockUserCommand', {userId: user.id, blockedUserId}));
//     }

//     @Get()
//     @ApiOperation({summary: 'Get list of friends for user'})
//     async getFriends(@AuthUser() user: User): Promise<User[]> {
//         return await lastValueFrom(this.userClient.send<User[]>('GetAllFriendCommand', {userId: user.id}));
//     }

//     @Get('requests')
//     @ApiOperation({summary: 'Get pending friend requests'})
//     async getFriendRequests(@AuthUser() user: User): Promise<FriendRequest[]> {
//         return await lastValueFrom(
//             this.userClient.send<FriendRequest[]>('GetRequestsFriendCommand', {userId: user.id})
//         );
//     }

//     @Put(':friendId/group')
//     @ApiOperation({summary: 'Update friend group'})
//     async updateFriendGroup(
//         @AuthUser() user: User,
//         @Param('friendId') friendId: string,
//         @Body('group') group: string
//     ): Promise<Friend> {
//         return await lastValueFrom(
//             this.userClient.send<Friend>('UpdateGroupFriendCommand', {userId: user.id, friendId, group})
//         );
//     }
// }

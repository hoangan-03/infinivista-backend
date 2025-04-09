import {Controller} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';

import {FriendRequest} from '@/entities/local/friend-request.entity';
import {User} from '@/entities/local/user.entity';

import {FriendService} from '../services/friend.service';

@Controller()
export class FriendController {
    constructor(private readonly friendService: FriendService) {}

    @MessagePattern('GetFriendsUserCommand')
    async getFriends(payload: {userId: string}): Promise<User[]> {
        return this.friendService.getFriends(payload.userId);
    }

    @MessagePattern('GetFriendRequestsUserCommand')
    async getFriendRequests(payload: {userId: string}): Promise<FriendRequest[]> {
        return this.friendService.getFriendRequests(payload.userId);
    }

    @MessagePattern('RemoveFriendUserCommand')
    async removeFriend(payload: {userId: string; friendId: string}): Promise<{success: boolean}> {
        return this.friendService.removeFriend(payload.userId, payload.friendId);
    }

    @MessagePattern('SendFriendRequestUserCommand')
    async sendFriendRequest(payload: {senderId: string; recipientId: string}): Promise<FriendRequest> {
        return this.friendService.sendFriendRequest(payload.senderId, payload.recipientId);
    }

    @MessagePattern('RespondToFriendRequestUserCommand')
    async respondToFriendRequest(payload: {requestId: string; accept: boolean}): Promise<{success: boolean}> {
        return this.friendService.respondToFriendRequest(payload.requestId, payload.accept);
    }

    // @Put(':friendId/group')
    // @UseGuards(JWTAuthGuard)
    // @MessagePattern('UpdateGroupFriendCommand')
    // async updateFriendGroup(payload: {userId: string; friendId: string; group: string}): Promise<Friend> {
    //     return this.friendService.updateFriendGroup(payload.userId, payload.friendId, payload.group);
    // }
}

import {MessagePattern} from '@nestjs/microservices';

import {FriendRequest} from '@/entities/local/friend-request.entity';
import {User} from '@/entities/local/user.entity';

import {FriendService} from '../services/friend.service';

export class FriendController {
    constructor(private readonly friendService: FriendService) {}

    @MessagePattern('SendRequestFriendCommand')
    async sendFriendRequest(payload: {userId: string; recipientId: string}): Promise<FriendRequest> {
        return this.friendService.sendFriendRequest(payload.userId, payload.recipientId);
    }

    @MessagePattern('RespondToRequestFriendCommand')
    async respondToRequest(payload: {userId: string; requestId: string; accept: boolean}): Promise<void> {
        return this.friendService.respondToFriendRequest(payload.requestId, payload.userId, payload.accept);
    }

    @MessagePattern('RemoveFriendCommand')
    async removeFriend(payload: {userId: string; friendId: string}): Promise<void> {
        return this.friendService.removeFriend(payload.userId, payload.friendId);
    }

    @MessagePattern('BlockUserCommand')
    async blockUser(payload: {userId: string; blockedUserId: string}): Promise<void> {
        return this.friendService.blockUser(payload.userId, payload.blockedUserId);
    }

    @MessagePattern('GetAllFriendCommand')
    async getFriends(payload: {userId: string}): Promise<User[]> {
        return this.friendService.getFriends(payload.userId);
    }

    @MessagePattern('GetRequestsFriendCommand')
    async getFriendRequests(payload: {userId: string}): Promise<FriendRequest[]> {
        return this.friendService.getFriendRequests(payload.userId);
    }

    // @Put(':friendId/group')
    // @UseGuards(JWTAuthGuard)
    // @MessagePattern('UpdateGroupFriendCommand')
    // async updateFriendGroup(payload: {userId: string; friendId: string; group: string}): Promise<Friend> {
    //     return this.friendService.updateFriendGroup(payload.userId, payload.friendId, payload.group);
    // }
}

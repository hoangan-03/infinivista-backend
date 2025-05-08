import {Controller} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';

import {FriendRequest} from '@/entities/local/friend-request.entity';
import {User} from '@/entities/local/user.entity';
import {UserFollow} from '@/entities/local/user-follow.entity';
import {PaginationResponseInterface} from '@/interfaces/pagination-response.interface';

import {FriendService} from '../services/friend.service';

@Controller()
export class FriendController {
    constructor(private readonly friendService: FriendService) {}

    @MessagePattern('GetFriendsUserCommand')
    async getFriends(payload: {
        userId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<User>> {
        return this.friendService.getFriends(payload.userId, payload.page, payload.limit);
    }

    @MessagePattern('GetFriendRequestsUserCommand')
    async getFriendRequests(payload: {
        userId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<FriendRequest>> {
        return this.friendService.getFriendRequests(payload.userId, payload.page, payload.limit);
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

    @MessagePattern('CheckFriendshipUserCommand')
    async checkFriendship(payload: {userId: string; friendId: string}): Promise<{isFriend: boolean}> {
        const result = await this.friendService.checkFriendship(payload.userId, payload.friendId);
        return {isFriend: result};
    }

    @MessagePattern('FollowUserCommand')
    async followUser(payload: {userId: string; followingId: string}): Promise<UserFollow> {
        return this.friendService.followUser(payload.userId, payload.followingId);
    }

    @MessagePattern('UnfollowUserCommand')
    async unfollowUser(payload: {userId: string; followingId: string}): Promise<{success: boolean}> {
        return this.friendService.unfollowUser(payload.userId, payload.followingId);
    }

    @MessagePattern('GetFollowersCommand')
    async getFollowers(payload: {
        userId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<User>> {
        return this.friendService.getFollowers(payload.userId, payload.page, payload.limit);
    }

    @MessagePattern('GetFollowingCommand')
    async getFollowing(payload: {
        userId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<User>> {
        return this.friendService.getFollowing(payload.userId, payload.page, payload.limit);
    }

    @MessagePattern('GetFollowerCountCommand')
    async getFollowerCount(payload: {userId: string}): Promise<number> {
        return this.friendService.getFollowerCount(payload.userId);
    }

    @MessagePattern('GetFollowingCountCommand')
    async getFollowingCount(payload: {userId: string}): Promise<number> {
        return this.friendService.getFollowingCount(payload.userId);
    }

    @MessagePattern('IsFollowingCommand')
    async isFollowing(payload: {followerId: string; followingId: string}): Promise<boolean> {
        return this.friendService.isFollowing(payload.followerId, payload.followingId);
    }

    // @Put(':friendId/group')
    // @UseGuards(JWTAuthGuard)
    // @MessagePattern('UpdateGroupFriendCommand')
    // async updateFriendGroup(payload: {userId: string; friendId: string; group: string}): Promise<Friend> {
    //     return this.friendService.updateFriendGroup(payload.userId, payload.friendId, payload.group);
    // }
}

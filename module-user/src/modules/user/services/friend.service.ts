import {BadRequestException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {In, Not} from 'typeorm';

import {Friend} from '@/entities/local/friend.entity';
import {FriendRequest} from '@/entities/local/friend-request.entity';
import {User} from '@/entities/local/user.entity';
import {UserFollow} from '@/entities/local/user-follow.entity';
import {PaginationResponseInterface} from '@/interfaces/pagination-response.interface';

import {FriendStatus} from '../enums/friend-status.enum';

@Injectable()
export class FriendService {
    private readonly logger = new Logger(FriendService.name);
    constructor(
        @InjectRepository(Friend)
        private readonly friendRepository: Repository<Friend>,
        @InjectRepository(FriendRequest)
        private readonly friendRequestRepository: Repository<FriendRequest>,
        @InjectRepository(UserFollow)
        private readonly userFollowRepository: Repository<UserFollow>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {}

    async sendFriendRequest(senderId: string, recipientId: string): Promise<FriendRequest> {
        // Check if request already exists
        if (senderId === recipientId) {
            throw new BadRequestException('Cannot send friend request to yourself');
        }
        const existingRequest = await this.friendRequestRepository.findOne({
            where: [
                {sender_id: senderId, recipient_id: recipientId},
                {sender_id: recipientId, recipient_id: senderId},
            ],
        });

        if (existingRequest) {
            throw new BadRequestException('Friend request already exists');
        }

        // Check if already friends
        const existingFriend = await this.friendRepository.findOne({
            where: [
                {user_id: senderId, friend_id: recipientId},
                {user_id: recipientId, friend_id: senderId},
            ],
        });

        if (existingFriend) {
            throw new BadRequestException('Users are already friends');
        }

        // Create friend request
        const request = this.friendRequestRepository.create({
            sender_id: senderId,
            recipient_id: recipientId,
            status: FriendStatus.PENDING,
        });

        return this.friendRequestRepository.save(request);
    }

    async respondToFriendRequest(requestId: string, accept: boolean): Promise<{success: boolean}> {
        const request = await this.friendRequestRepository.findOne({
            where: {id: requestId},
        });

        if (!request) {
            throw new NotFoundException('Friend request not found');
        }

        if (accept) {
            const friendship1 = this.friendRepository.create({
                user_id: request.sender_id,
                friend_id: request.recipient_id,
            });

            const friendship2 = this.friendRepository.create({
                user_id: request.recipient_id,
                friend_id: request.sender_id,
            });

            await this.friendRepository.save([friendship1, friendship2]);
            request.status = FriendStatus.ACCEPTED;
        } else {
            request.status = FriendStatus.DECLINED;
        }

        await this.friendRequestRepository.save(request);
        return {success: true};
    }

    async removeFriend(userId: string, friendId: string): Promise<{success: boolean}> {
        // Find the friendship records first
        if (userId === friendId) {
            throw new BadRequestException('Cannot remove yourself as a friend');
        }

        const friendships = await this.friendRepository.find({
            where: [
                {user_id: userId, friend_id: friendId},
                {user_id: friendId, friend_id: userId},
            ],
        });

        const friendRequestRemained = await this.friendRequestRepository.findOne({
            where: [
                {sender_id: userId, recipient_id: friendId},
                {sender_id: friendId, recipient_id: userId},
            ],
        });
        if (friendships.length > 0 && friendRequestRemained) {
            await this.friendRepository.remove(friendships);
            await this.friendRequestRepository.remove(friendRequestRemained);
            return {success: true};
        } else {
            throw new NotFoundException('Friendship not found');
        }
    }

    async getSuggestedFriends(userId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<User>> {
        // Get all of the user's friends
        const userFriendships = await this.friendRepository.find({
            where: {user_id: userId},
            relations: ['friend'],
        });

        // Get IDs of user's friends
        const userFriendIds = userFriendships.map((f) => f.friend_id);

        // Get pending friend requests
        const pendingRequests = await this.friendRequestRepository.find({
            where: [
                {sender_id: userId, status: FriendStatus.PENDING},
                {recipient_id: userId, status: FriendStatus.PENDING},
            ],
        });

        // Extract user IDs from pending requests
        const pendingRequestUserIds = new Set<string>();
        pendingRequests.forEach((request) => {
            if (request.sender_id === userId) {
                pendingRequestUserIds.add(request.recipient_id);
            } else {
                pendingRequestUserIds.add(request.sender_id);
            }
        });

        // Get all users except the current user, their friends, and users with pending requests
        const excludedIds = [...userFriendIds, userId, ...Array.from(pendingRequestUserIds)];

        const [users, total] = await this.userRepository.findAndCount({
            where: {
                id: Not(In(excludedIds)),
            },
            skip: (page - 1) * limit,
            take: limit,
            order: {
                createdAt: 'DESC',
            },
        });

        // Remove password from user objects
        const usersWithoutPassword = users.map((user) => {
            const {password, ...userWithoutPassword} = user;
            return userWithoutPassword as User;
        });

        return {
            data: usersWithoutPassword,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getFriends(userId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<User>> {
        const [friendships, total] = await this.friendRepository.findAndCount({
            where: {user_id: userId},
            relations: ['friend'],
            skip: (page - 1) * limit,
            take: limit,
        });

        const users = friendships.map((f) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {password, ...userWithoutPassword} = f.friend;
            return userWithoutPassword as User;
        });

        return {
            data: users,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getFriendRequests(userId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<FriendRequest>> {
        const [requests, total] = await this.friendRequestRepository.findAndCount({
            where: {recipient_id: userId, status: FriendStatus.PENDING},
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            data: requests,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Check if two users are friends
     * @param userId First user ID
     * @param friendId Second user ID
     * @returns True if the users are friends, false otherwise
     */
    async checkFriendship(userId: string, friendId: string): Promise<boolean> {
        if (userId === friendId) return false;

        const friendship = await this.friendRepository.findOne({
            where: [
                {user_id: userId, friend_id: friendId},
                {user_id: friendId, friend_id: userId},
            ],
        });

        return !!friendship;
    }

    async followUser(followerId: string, followingId: string): Promise<UserFollow> {
        // Can't follow yourself
        if (followerId === followingId) {
            throw new BadRequestException('Cannot follow yourself');
        }

        // Check if already following
        const existingFollow = await this.userFollowRepository.findOne({
            where: {
                follower_id: followerId,
                following_id: followingId,
            },
        });

        if (existingFollow) {
            return existingFollow; // Already following
        }

        // Create new follow relationship
        const follow = this.userFollowRepository.create({
            follower_id: followerId,
            following_id: followingId,
        });

        return this.userFollowRepository.save(follow);
    }

    async unfollowUser(followerId: string, followingId: string): Promise<{success: boolean}> {
        const follow = await this.userFollowRepository.findOne({
            where: {
                follower_id: followerId,
                following_id: followingId,
            },
        });

        if (!follow) {
            return {success: true}; // Not following, so no need to unfollow
        }

        await this.userFollowRepository.remove(follow);
        return {success: true};
    }

    async getFollowers(userId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<User>> {
        const [followers, total] = await this.userFollowRepository.findAndCount({
            where: {following_id: userId},
            relations: ['follower'],
            skip: (page - 1) * limit,
            take: limit,
        });

        const users = followers.map((f) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {password, ...userWithoutPassword} = f.follower;
            return userWithoutPassword as User;
        });

        return {
            data: users,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getFollowing(userId: string, page = 1, limit = 10): Promise<PaginationResponseInterface<User>> {
        const [following, total] = await this.userFollowRepository.findAndCount({
            where: {follower_id: userId},
            relations: ['following'],
            skip: (page - 1) * limit,
            take: limit,
        });

        const users = following.map((f) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {password, ...userWithoutPassword} = f.following;
            return userWithoutPassword as User;
        });

        return {
            data: users,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getFollowerCount(userId: string): Promise<number> {
        return this.userFollowRepository.count({
            where: {following_id: userId},
        });
    }

    async getFollowingCount(userId: string): Promise<number> {
        return this.userFollowRepository.count({
            where: {follower_id: userId},
        });
    }

    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        const follow = await this.userFollowRepository.findOne({
            where: {
                follower_id: followerId,
                following_id: followingId,
            },
        });

        return !!follow;
    }

    // async updateFriendGroup(userId: string, friendId: string, group: string): Promise<Friend> {
    //     const friendship = await this.friendRepository.findOne({
    //         where: {user_id: userId, friend_id: friendId},
    //     });

    //     if (!friendship) {
    //         throw new NotFoundException('Friend relationship not found');
    //     }

    //     friendship.group = group;
    //     return this.friendRepository.save(friendship);
    // }
}

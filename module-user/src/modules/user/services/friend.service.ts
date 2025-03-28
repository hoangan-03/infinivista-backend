import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {BlockedUser} from '@/entities/local/blocked-user.entity';
import {Friend} from '@/entities/local/friend.entity';
import {FriendRequest} from '@/entities/local/friend-request.entity';
import {User} from '@/entities/local/user.entity';

import {FriendStatus} from '../enums/friend-status.enum';

@Injectable()
export class FriendService {
    constructor(
        @InjectRepository(Friend)
        private readonly friendRepository: Repository<Friend>,
        @InjectRepository(FriendRequest)
        private readonly friendRequestRepository: Repository<FriendRequest>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(BlockedUser)
        private readonly blockedUserRepository: Repository<BlockedUser>
    ) {}

    async sendFriendRequest(senderId: string, recipientId: string): Promise<FriendRequest> {
        // Check if request already exists
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

    async respondToFriendRequest(requestId: string, userId: string, accept: boolean): Promise<void> {
        const request = await this.friendRequestRepository.findOne({
            where: {id: requestId, recipient_id: userId},
        });

        if (!request) {
            throw new NotFoundException('Friend request not found');
        }

        if (accept) {
            // Create both-way friend relationship
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
    }

    async removeFriend(userId: string, friendId: string): Promise<void> {
        // Find the friendship records first
        const friendships = await this.friendRepository.find({
            where: [
                {user_id: userId, friend_id: friendId},
                {user_id: friendId, friend_id: userId},
            ],
        });

        // Then delete them by their IDs
        if (friendships.length > 0) {
            await this.friendRepository.remove(friendships);
        }
    }

    async blockUser(userId: string, blockedUserId: string): Promise<void> {
        // Remove friend relationship if exists
        await this.removeFriend(userId, blockedUserId);

        // Create blocked relationship
        const blocked = this.blockedUserRepository.create({
            user_id: userId,
            blocked_user_id: blockedUserId,
        });

        await this.blockedUserRepository.save(blocked);
    }

    async getFriends(userId: string): Promise<User[]> {
        const friendships = await this.friendRepository.find({
            where: {user_id: userId},
            relations: ['friend'],
        });

        return friendships.map((f) => f.friend);
    }

    async getFriendRequests(userId: string): Promise<FriendRequest[]> {
        return this.friendRequestRepository.find({
            where: {recipient_id: userId, status: FriendStatus.PENDING},
            relations: ['sender'],
        });
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

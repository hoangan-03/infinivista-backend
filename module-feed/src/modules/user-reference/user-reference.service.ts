import {Inject, Injectable, Logger} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {InjectRepository} from '@nestjs/typeorm';
import {lastValueFrom} from 'rxjs';
import {Repository} from 'typeorm';

import {UserReference} from '@/entities/external/user-reference.entity';

@Injectable()
export class UserReferenceService {
    private readonly logger = new Logger(UserReferenceService.name);

    constructor(
        @InjectRepository(UserReference)
        private readonly userReferenceRepository: Repository<UserReference>,
        @Inject('USER_SERVICE') private readonly userClient: ClientProxy
    ) {}

    async findById(id: string): Promise<UserReference> {
        let userRef = await this.userReferenceRepository.findOne({where: {id}});
        if (!userRef) {
            userRef = this.userReferenceRepository.create({id});
            await this.userReferenceRepository.save(userRef);
        }
        return userRef;
    }

    async upsertUserReference(userData: Partial<UserReference>): Promise<UserReference> {
        const {id} = userData;

        const existingRef = await this.userReferenceRepository.findOne({
            where: {id},
        });

        if (existingRef) {
            this.userReferenceRepository.merge(existingRef, userData);
            return this.userReferenceRepository.save(existingRef);
        } else {
            const newRef = this.userReferenceRepository.create(userData);
            return this.userReferenceRepository.save(newRef);
        }
    }

    /**
     * Check if two users are friends
     * @param userId The ID of the first user
     * @param otherUserId The ID of the second user to check friendship with
     * @returns Boolean indicating if the users are friends
     */
    async checkFriendship(userId: string, otherUserId: string): Promise<boolean> {
        try {
            const response = await lastValueFrom(
                this.userClient.send('CheckFriendshipUserCommand', {userId, friendId: otherUserId})
            );
            return response.isFriend;
        } catch (error: any) {
            this.logger.error(`Failed to check friendship: ${error.message}`);
            return false;
        }
    }

    /**
     * Get all friends of a user
     * @param userId The ID of the user to get friends for
     * @returns Array of user references representing the user's friends
     */
    async getFriends(userId: string): Promise<UserReference[]> {
        try {
            const response = await lastValueFrom(this.userClient.send('GetFriendsUserCommand', {userId}));

            // Convert user data to UserReference entities
            const friendRefs: UserReference[] = [];

            // Check if response has expected structure
            if (response && response.data && Array.isArray(response.data)) {
                // Iterate over the data array in the response
                for (const friend of response.data) {
                    if (friend && friend.id) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                        const userRef = await this.findById(friend.id);
                        if (userRef) {
                            friendRefs.push(userRef);
                        }
                    }
                }
            } else {
                this.logger.warn(
                    `Unexpected response structure from GetFriendsUserCommand: ${JSON.stringify(response)}`
                );
            }

            return friendRefs;
        } catch (error: any) {
            this.logger.error(`Failed to get friends: ${error}`);
            return [];
        }
    }

    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        try {
            const response = await lastValueFrom(this.userClient.send('IsFollowingCommand', {followerId, followingId}));
            return response;
        } catch (error: any) {
            this.logger.error(`Failed to check following status: ${error.message}`);
            return false;
        }
    }

    async getFollowerCount(userId: string): Promise<number> {
        try {
            return await lastValueFrom(this.userClient.send('GetFollowerCountCommand', {userId}));
        } catch (error: any) {
            this.logger.error(`Failed to get follower count: ${error.message}`);
            return 0;
        }
    }

    async getFollowingCount(userId: string): Promise<number> {
        try {
            return await lastValueFrom(this.userClient.send('GetFollowingCountCommand', {userId}));
        } catch (error: any) {
            this.logger.error(`Failed to get following count: ${error.message}`);
            return 0;
        }
    }
}

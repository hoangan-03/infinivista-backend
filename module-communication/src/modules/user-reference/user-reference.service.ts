import {Injectable, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {UserReference} from '@/entities/external/user-reference.entity';

interface UserData {
    id: string;
}

@Injectable()
export class UserReferenceService {
    private readonly logger = new Logger(UserReferenceService.name);

    constructor(
        @InjectRepository(UserReference)
        private readonly userReferenceRepository: Repository<UserReference>
    ) {}

    async findById(id: string): Promise<UserReference> {
        const userRef = await this.userReferenceRepository.findOne({where: {id}});

        if (!userRef) {
            throw new NotFoundException(`User reference with ID ${id} not found`);
        }

        return userRef;
    }

    async createOrUpdateUserReference(userData: UserData): Promise<UserReference> {
        this.logger.log(`Creating or updating user reference for ${userData.id}`);

        let userRef = await this.userReferenceRepository.findOne({
            where: {id: userData.id},
        });

        if (userRef) {
            // Update existing reference
            this.logger.debug(`Updating existing user reference: ${userData.id}`);

            // Only update fields that were provided
            // if (userData.username !== undefined) userRef.username = userData.username;
            // if (userData.email !== undefined) userRef.email = userData.email;
            // if (userData.firstName !== undefined) userRef.firstName = userData.firstName;
            // if (userData.lastName !== undefined) userRef.lastName = userData.lastName;
            // if (userData.profileImageUrl !== undefined) userRef.profileImageUrl = userData.profileImageUrl;

            return this.userReferenceRepository.save(userRef);
        } else {
            // Create new reference
            this.logger.debug(`Creating new user reference: ${userData.id}`);
            userRef = this.userReferenceRepository.create({
                id: userData.id,
                // username: userData.username || '',
                // email: userData.email || '',
                // firstName: userData.firstName || '',
                // lastName: userData.lastName || '',
                // profileImageUrl: userData.profileImageUrl || '',
            });

            return this.userReferenceRepository.save(userRef);
        }
    }

    async markUserReferenceAsDeleted(userId: string): Promise<UserReference> {
        this.logger.log(`Marking user reference ${userId} as deleted`);

        const userRef = await this.userReferenceRepository.findOne({
            where: {id: userId},
        });

        if (!userRef) {
            this.logger.warn(`User reference not found for deletion: ${userId}`);
            throw new NotFoundException(`User reference with ID ${userId} not found`);
        }
        return this.userReferenceRepository.save(userRef);
    }

    async getAllUserReferences(): Promise<UserReference[]> {
        return this.userReferenceRepository.find({});
    }

    async syncAllUsers(users: UserData[]): Promise<void> {
        this.logger.log(`Syncing ${users.length} user references`);

        for (const userData of users) {
            await this.createOrUpdateUserReference(userData);
        }

        this.logger.log('User reference sync completed');
    }
}

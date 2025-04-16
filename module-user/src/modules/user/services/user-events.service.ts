import {Injectable, Logger} from '@nestjs/common';
import {Inject} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {firstValueFrom} from 'rxjs';

interface UserEventData {
    id: string;
}

@Injectable()
export class UserEventsService {
    private readonly logger = new Logger(UserEventsService.name);

    constructor(
        @Inject('COMMUNICATION_SERVICE') private communicationClient: ClientProxy,
        @Inject('FEED_SERVICE') private feedClient: ClientProxy
    ) {}

    async publishUserCreated(userData: UserEventData): Promise<void> {
        this.logger.log(`Publishing user created event for user ${userData.id}`);

        try {
            // Publish to communication module
            await firstValueFrom(this.communicationClient.emit('UserCreatedEvent', userData));
            this.logger.debug(`Published UserCreatedEvent to communication module for user ${userData.id}`);

            // Publish to feed module
            await firstValueFrom(this.feedClient.emit('UserCreatedEvent', userData));
            this.logger.debug(`Published UserCreatedEvent to feed module for user ${userData.id}`);
        } catch (error: any) {
            this.logger.error(`Error publishing UserCreatedEvent: ${error.message}`, error.stack);
            // We don't rethrow the error here to prevent transaction failures
            // due to messaging issues, but log it for troubleshooting
        }
    }

    async publishUserUpdated(userData: UserEventData): Promise<void> {
        this.logger.log(`Publishing user updated event for user ${userData.id}`);

        try {
            // Publish to communication module
            await firstValueFrom(this.communicationClient.emit('UserUpdatedEvent', userData));
            this.logger.debug(`Published UserUpdatedEvent to communication module for user ${userData.id}`);

            // Publish to feed module
            await firstValueFrom(this.feedClient.emit('UserUpdatedEvent', userData));
            this.logger.debug(`Published UserUpdatedEvent to feed module for user ${userData.id}`);
        } catch (error: any) {
            this.logger.error(`Error publishing UserUpdatedEvent: ${error.message}`, error.stack);
            // We don't rethrow the error here to prevent transaction failures
        }
    }

    async publishUserDeleted(userData: {id: string}): Promise<void> {
        this.logger.log(`Publishing user deleted event for user ${userData.id}`);

        try {
            // Publish to communication module
            await firstValueFrom(this.communicationClient.emit('UserDeletedEvent', userData));
            this.logger.debug(`Published UserDeletedEvent to communication module for user ${userData.id}`);

            // Publish to feed module
            await firstValueFrom(this.feedClient.emit('UserDeletedEvent', userData));
            this.logger.debug(`Published UserDeletedEvent to feed module for user ${userData.id}`);
        } catch (error: any) {
            this.logger.error(`Error publishing UserDeletedEvent: ${error.message}`, error.stack);
            // We don't rethrow the error here to prevent transaction failures
        }
    }

    // Method to trigger a manual sync of all users
    async triggerUserSync(users: UserEventData[]): Promise<void> {
        this.logger.log(`Triggering sync for ${users.length} users`);

        try {
            await firstValueFrom(this.communicationClient.emit('SyncUsersCommand', {users}));
            await firstValueFrom(this.feedClient.emit('SyncUsersCommand', {users}));

            this.logger.log('User sync trigger completed');
        } catch (error: any) {
            this.logger.error(`Error triggering user sync: ${error.message}`, error.stack);
            throw error; // Here we rethrow as this is likely an admin operation
        }
    }
}

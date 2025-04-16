import {Controller, Logger} from '@nestjs/common';
import {EventPattern} from '@nestjs/microservices';

import {UserReferenceService} from './user-reference.service';

interface UserEventData {
    id: string;
}

@Controller()
export class UserReferenceController {
    private readonly logger = new Logger(UserReferenceController.name);

    constructor(private readonly userReferenceService: UserReferenceService) {}

    @EventPattern('UserCreatedEvent')
    async handleUserCreated(data: UserEventData): Promise<void> {
        this.logger.log(`Received UserCreatedEvent for user ${data.id}`);
        await this.userReferenceService.createOrUpdateUserReference(data);
    }

    @EventPattern('UserUpdatedEvent')
    async handleUserUpdated(data: UserEventData): Promise<void> {
        this.logger.log(`Received UserUpdatedEvent for user ${data.id}`);
        await this.userReferenceService.createOrUpdateUserReference(data);
    }
}

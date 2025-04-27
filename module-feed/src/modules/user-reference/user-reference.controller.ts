import {Controller} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';

import {UserReference} from '@/entities/external/user-reference.entity';

import {UserReferenceService} from './user-reference.service';

@Controller()
export class UserReferenceController {
    constructor(private readonly userReferenceService: UserReferenceService) {}

    @MessagePattern('SyncUserDataCommand')
    async syncUserData(userData: Partial<UserReference>): Promise<UserReference> {
        return this.userReferenceService.upsertUserReference(userData);
    }
}

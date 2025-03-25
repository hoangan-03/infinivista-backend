import {ApiProperty} from '@nestjs/swagger';

import {BaseEntity} from '../../base/base-class';
import {User} from './user.entity';

export class UserStatus extends BaseEntity {
    @ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'User status unique identifier',
    })
    id: string;

    @ApiProperty({type: () => User})
    user: User;

    user_id: string;

    @ApiProperty({
        example: false,
        description: 'User online status',
    })
    isOnline: boolean;

    @ApiProperty({
        example: false,
        description: 'User suspension status',
    })
    isSuspended: boolean;

    @ApiProperty({
        example: false,
        description: 'User deletion status',
    })
    isDeleted: boolean;
}

import {ApiProperty} from '@nestjs/swagger';

import {BaseEntity} from '../../base/base-class';
import {User} from './user.entity';

export class Friend extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the friendship relationship',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'The user who owns this friendship',
        type: () => User,
    })
    user: User;

    @ApiProperty({
        description: 'The friend of the user',
        type: () => User,
    })
    friend: User;
}

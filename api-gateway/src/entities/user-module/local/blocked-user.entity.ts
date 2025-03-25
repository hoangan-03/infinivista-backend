import {ApiProperty} from '@nestjs/swagger';

import {User} from './user.entity';

export class BlockedUser {
    @ApiProperty({
        description: 'Unique identifier for the block relationship',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'ID of the user who created the block',
        example: '550e8400-e29b-41d4-a716-446655440001',
    })
    user_id: string;

    @ApiProperty({
        description: 'User who created the block',
        type: () => User,
    })
    user: User;

    @ApiProperty({
        description: 'ID of the user who was blocked',
        example: '550e8400-e29b-41d4-a716-446655440002',
    })
    blocked_user_id: string;

    @ApiProperty({
        description: 'User who was blocked',
        type: () => User,
    })
    blockedUser: User;

    @ApiProperty({
        description: 'When the block was created',
        example: '2023-01-01T12:00:00Z',
    })
    created_at: Date;
}

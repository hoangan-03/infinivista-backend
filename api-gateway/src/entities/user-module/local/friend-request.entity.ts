import {ApiProperty} from '@nestjs/swagger';

import {FriendStatus} from '@/enums/user-module/friend-status.enum';

import {BaseEntity} from '../../base/base-class';
import {User} from './user.entity';

export class FriendRequest extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the friend request',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'The user who sent the friend request',
        type: () => User,
    })
    sender: User;

    @ApiProperty({
        description: 'ID of the user who sent the friend request',
        example: '550e8400-e29b-41d4-a716-446655440001',
    })
    sender_id: string;

    @ApiProperty({
        description: 'The user who received the friend request',
        type: () => User,
    })
    recipient: User;

    @ApiProperty({
        description: 'ID of the user who received the friend request',
        example: '550e8400-e29b-41d4-a716-446655440002',
    })
    recipient_id: string;

    @ApiProperty({
        description: 'Current status of the friend request',
        enum: FriendStatus,
        example: FriendStatus.PENDING,
        enumName: 'FriendStatus',
    })
    status: FriendStatus;
}

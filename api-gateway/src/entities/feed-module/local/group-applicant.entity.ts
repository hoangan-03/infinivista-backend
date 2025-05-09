import {ApiProperty} from '@nestjs/swagger';
import {BaseEntity, Entity} from 'typeorm';

import {UserReference} from '../external/user.entity';

@Entity()
export class GroupApplicant extends BaseEntity {
    @ApiProperty({
        description: 'The ID of the group applicant',
        example: '550e8400-e29b-41d4-a716-446655440000',
        type: String,
    })
    id: string;

    @ApiProperty({
        description: 'The ID of the group',
        example: '550e8400-e29b-41d4-a716-446655440000',
        type: String,
    })
    group_id: string;

    @ApiProperty({
        description: 'The user',
        example: '550e8400-e29b-41d4-a716-446655440000',
        type: UserReference,
    })
    user: UserReference;

    user_id: string;

    @ApiProperty({
        description: 'Whether the user is verified',
        example: false,
        type: Boolean,
    })
    isVerified: boolean;

    @ApiProperty({
        description: 'The message of the group applicant',
        example: 'I am a group applicant',
        type: String,
    })
    message?: string;
}

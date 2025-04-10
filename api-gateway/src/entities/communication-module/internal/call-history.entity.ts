import {ApiProperty} from '@nestjs/swagger';
import {Entity, ManyToOne} from 'typeorm';

import {BaseEntity} from '../../base/base-class';
import {UserReference} from '../external/user-reference.entity';

@Entity()
export class CallHistory extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the call history record',
        example: '550e8400-e29b-41d4-a716-446655440000',
        type: String,
    })
    call_id: string;

    @ApiProperty({
        description: 'When the call started',
        example: '2024-05-15T10:30:00Z',
        type: Date,
    })
    start_time: Date;

    @ApiProperty({
        description: 'When the call ended',
        example: '2024-05-15T10:45:30Z',
        type: Date,
    })
    end_time: Date;

    @ApiProperty({
        description: 'User who initiated the call',
        type: () => UserReference,
    })
    @ManyToOne(() => UserReference, (user) => user.incomingCallHistories, {onDelete: 'SET NULL'})
    caller: UserReference;

    @ApiProperty({
        description: 'User who received the call',
        type: () => UserReference,
    })
    @ManyToOne(() => UserReference, (user) => user.outcomingCallHistories)
    receiver: UserReference;
}

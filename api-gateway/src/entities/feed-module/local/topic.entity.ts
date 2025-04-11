import {ApiProperty} from '@nestjs/swagger';

import {BaseEntity} from '../../base/base-class';

export class Topic extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the topic',
        example: '550e8400-e29b-41d4-a716-446655440000',
        type: String,
    })
    id: string;

    @ApiProperty({
        description: 'Name of the topic',
        example: 'Technology',
        type: String,
    })
    topicName: string;

    @ApiProperty({
        description: 'Description of the topic',
        example: 'All posts related to technology and innovation',
        type: String,
        required: false,
        nullable: true,
    })
    topicDescription: string | null;
}

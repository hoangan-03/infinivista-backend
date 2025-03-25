import {ApiProperty} from '@nestjs/swagger';

import {BaseEntity} from '../../base/base-class';
import {NewsFeed} from './news-feed.entity';

export class Advertisement extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the advertisement',
        example: 1,
        type: Number,
    })
    id: number;

    @ApiProperty({
        description: 'Title of the advertisement',
        example: 'Summer Sale!',
        type: String,
    })
    title: string;

    @ApiProperty({
        description: 'Content of the advertisement',
        example: 'Get 50% off on all products',
        type: String,
    })
    content: string;

    @ApiProperty({
        description: 'Start time of the advertisement',
        example: '2023-01-01T00:00:00Z',
        type: Date,
    })
    start_time: Date;

    @ApiProperty({
        description: 'End time of the advertisement',
        example: '2023-01-31T23:59:59Z',
        type: Date,
    })
    end_time: Date;

    @ApiProperty({
        description: 'The news feed this advertisement belongs to',
        type: () => NewsFeed,
    })
    newsFeed: NewsFeed;
}

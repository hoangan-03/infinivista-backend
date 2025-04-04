import {ApiProperty} from '@nestjs/swagger';

import {NewsFeed} from './newsfeed.entity';

export class HashTag {
    @ApiProperty({
        description: 'Unique identifier for the hashtag',
        example: '550e8400-e29b-41d4-a716-446655440000',
        type: String,
    })
    id: string;

    @ApiProperty({
        description: 'Name of the hashtag (without the # symbol)',
        example: 'infinivista',
        type: String,
    })
    name: string;

    @ApiProperty({
        description: 'News feeds that use this hashtag',
        type: () => [NewsFeed],
        isArray: true,
    })
    newsFeeds: NewsFeed[];
}

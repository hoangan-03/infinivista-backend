import {ApiProperty} from '@nestjs/swagger';

import {BaseEntity} from '../../base/base-class';
import {NewsFeed} from './newsfeed.entity';

export class Reel extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the reel',
        example: 1,
        type: Number,
    })
    id: string;

    @ApiProperty({
        description: 'URL to the reel video',
        example: 'https://storage.infinivista.com/reels/video123.mp4',
        type: String,
    })
    reel_url: string;

    @ApiProperty({
        description: 'Duration of the reel in seconds',
        example: 30,
        minimum: 5,
        maximum: 60,
        type: Number,
    })
    duration: number;

    @ApiProperty({
        description: 'The news feed this reel belongs to',
        type: () => NewsFeed,
    })
    newsFeed: NewsFeed;
}

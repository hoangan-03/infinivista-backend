import {ApiProperty} from '@nestjs/swagger';
import {BaseEntity} from '../../base/base-class';
import {NewsFeed} from './news-feed.entity';

export class LiveStreamHistory extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the live stream history record',
        example: 1,
        type: Number,
    })
    id: number;

    @ApiProperty({
        description: 'URL to access the live stream recording',
        example: 'https://storage.infinivista.com/livestreams/stream123.mp4',
        type: String,
    })
    stream_url: string;

    @ApiProperty({
        description: 'When the live stream started',
        example: '2023-03-15T14:30:00Z',
        type: Date,
    })
    start_time: Date;

    @ApiProperty({
        description: 'When the live stream ended',
        example: '2023-03-15T15:45:00Z',
        type: Date,
    })
    end_time: Date;

    @ApiProperty({
        description: 'Number of viewers who watched the live stream',
        example: 1250,
        type: Number,
        required: false,
    })
    view_count?: number;

    @ApiProperty({
        description: 'The news feed this live stream belongs to',
        type: () => NewsFeed,
    })
    newsFeed: NewsFeed;
}

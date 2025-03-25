import {ApiProperty} from '@nestjs/swagger';
import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/local/base-class';
import {NewsFeed} from '@/entities/local/news-feed.entity';

@Entity()
export class Story extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the story',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: number;

    @ApiProperty({
        description: 'URL to the story media (image or video)',
        example: 'https://storage.infinivista.com/stories/image123.jpg',
    })
    story_url: string;

    @ApiProperty({
        description: 'Duration in seconds that the story should be displayed',
        example: 15,
        minimum: 1,
        maximum: 60,
    })
    duration: number;

    @ApiProperty({
        description: 'The news feed this story belongs to',
        type: () => NewsFeed,
    })
    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.stories)
    newsFeed: NewsFeed;
}

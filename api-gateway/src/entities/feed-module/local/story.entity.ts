import {ApiProperty} from '@nestjs/swagger';
import {Entity} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';

import {Comment} from './comment.entity';
import {NewsFeed} from './newsfeed.entity';
import {UserReactStory} from './user-react-story.entity';

@Entity()
export class Story extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the story',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'URL to the story media (image or video)',
        example: 'https://storage.infinivista.com/stories/image123.jpg',
    })
    story_url: string;

    @ApiProperty({
        description: 'URL to the story thumbnail',
        example: 'https://storage.infinivista.com/stories/thumbnail123.jpg',
    })
    thumbnail_url: string;

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
    newsFeed: NewsFeed;

    @ApiProperty({
        description: 'List of comments associated with this story',
        type: () => Comment,
        isArray: true,
    })
    comments: Comment[];

    @ApiProperty({
        description: 'List of user reactions to this story',
        type: () => UserReactStory,
        isArray: true,
    })
    userReactions: UserReactStory[];
}

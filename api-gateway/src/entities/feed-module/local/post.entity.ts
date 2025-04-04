import {ApiProperty} from '@nestjs/swagger';

import {BaseEntity} from '../../base/base-class';
import {Comment} from './comment.entity';
import {NewsFeed} from './news-feed.entity';
import {PostAttachment} from './post-attachment';

export class Post extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the post',
        example: 1,
        type: Number,
    })
    id: string;

    @ApiProperty({
        description: 'Content text of the post',
        example: 'This is my first post on InfiniVista!',
        type: String,
    })
    content: string;

    @ApiProperty({
        description: 'The news feed this post belongs to',
        type: () => NewsFeed,
    })
    newsFeed: NewsFeed;

    @ApiProperty({
        description: 'Comments on this post',
        type: () => [Comment],
        isArray: true,
    })
    comments: Comment[];

    @ApiProperty({
        description: 'Attachments (images, videos) for this post',
        type: () => [PostAttachment],
        isArray: true,
    })
    postAttachments: PostAttachment[];
}

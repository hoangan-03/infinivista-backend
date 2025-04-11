import {ApiProperty} from '@nestjs/swagger';

import {visibilityEnum} from '@/enums/feed-module/visibility.enum';

import {BaseEntity} from '../../base/base-class';
import {Comment} from './comment.entity';
import {NewsFeed} from './newsfeed.entity';
import {PostAttachment} from './post-attachment';
import {Topic} from './topic.entity';
import {UserReactPost} from './user-react-post.entity';

export class Post extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the post',
        example: 1,
        type: Number,
    })
    id: string;

    @ApiProperty({
        description: 'Content text of the post',
        example:
            'This is my first post on InfiniVista, and I’m thrilled to share an experience that blends so many passions of mine! Recently, I embarked on an incredible trip to a breathtaking destination, where I used my brand-new high-tech camera to capture stunning landscapes and vibrant city scenes. The technology behind this camera is mind-blowing—its advanced sensors and AI-assisted features made every shot a masterpiece. After returning home, I spent hours experimenting with photo editing software, applying creative techniques like color grading and digital overlays to transform my travel photos into unique pieces of art. I’ve always believed that modern tools can elevate both the way we explore the world and how we express our creativity, and this journey proved it. Can’t wait to hear your thoughts on how tech, travel, and art intersect in your lives!',
        type: String,
    })
    content: string;

    @ApiProperty({
        description: 'Visibility setting for the post',
        enum: visibilityEnum,
        example: visibilityEnum.PUBLIC,
    })
    visibility: visibilityEnum;

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

    @ApiProperty({
        description: 'Reactions to this post',
        type: () => [UserReactPost],
        isArray: true,
    })
    userReactPost: UserReactPost[];

    @ApiProperty({
        description: 'Topics associated with this post',
        type: () => [Topic],
        isArray: true,
    })
    topics: Topic[];
}

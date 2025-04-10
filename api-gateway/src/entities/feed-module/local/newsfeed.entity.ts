import {ApiProperty} from '@nestjs/swagger';

import {visibilityEnum} from '../../../enums/feed-module/visibility.enum';
import {BaseEntity} from '../../base/base-class';
import {CommunityReference} from '../external/community.entity';
import {UserReference} from '../external/user.entity';
import {Advertisement} from './advertisement.entity';
import {HashTag} from './hashtag.entity';
import {LiveStreamHistory} from './live-stream-history.entity';
import {Post} from './post.entity';
import {Reel} from './reel.entity';
import {Story} from './story.entity';

export class NewsFeed extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the news feed',
        example: 1,
        type: Number,
    })
    id: string;

    @ApiProperty({
        description: 'Description or text content of the news feed',
        example: 'My journey through Europe',
        type: String,
        required: false,
    })
    description?: string;

    @ApiProperty({
        description: 'Visibility setting for the news feed',
        enum: visibilityEnum,
    })
    visibility: string;

    @ApiProperty({
        description: 'Reel associated with this news feed',
        type: () => Reel,
        required: false,
    })
    reel?: Reel;

    @ApiProperty({
        description: 'Stories associated with this news feed',
        type: () => [Story],
        isArray: true,
    })
    stories: Story[];

    @ApiProperty({
        description: 'Posts in this news feed',
        type: () => [Post],
        isArray: true,
    })
    posts: Post[];

    @ApiProperty({
        description: 'Live stream history records for this news feed',
        type: () => [LiveStreamHistory],
        isArray: true,
    })
    liveStreams: LiveStreamHistory[];

    @ApiProperty({
        description: 'Advertisements associated with this news feed',
        type: () => [Advertisement],
        isArray: true,
    })
    advertisements: Advertisement[];

    @ApiProperty({
        description: 'Community that owns this news feed (if applicable)',
        type: () => CommunityReference,
        required: false,
    })
    community?: CommunityReference;

    @ApiProperty({
        description: 'User who owns this news feed',
        type: () => UserReference,
    })
    owner: UserReference;

    @ApiProperty({
        description: 'Hashtags used in this news feed',
        type: () => [HashTag],
        isArray: true,
    })
    tags: HashTag[];

    @ApiProperty({
        description: 'Users tagged in this news feed',
        type: () => [UserReference],
        isArray: true,
    })
    taggedUsers: UserReference[];
}

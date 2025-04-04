import {ApiProperty} from '@nestjs/swagger';

import {ReactionType} from '@/enums/feed-module/reaction-type';

import {BaseEntity} from '../../base/base-class';
import {NewsFeed} from './newsfeed.entity';

export class Reaction extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the reaction',
        example: 1,
    })
    reaction_id: string;

    @ApiProperty({
        description: 'Type of reaction',
        enum: ReactionType,
        example: ReactionType.LIKE,
    })
    reaction_type: ReactionType;

    @ApiProperty({
        description: 'URL to the reaction image',
        example: 'https://storage.infinivista.com/reactions/like.png',
        type: String,
    })
    reaction_image_url: string;

    @ApiProperty({
        description: 'The news feed this reaction belongs to',
        type: () => NewsFeed,
    })
    newsFeed: NewsFeed;
}

import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {CommunityReference} from '@/entities/external/community-ref.entity';
import {UserReference} from '@/entities/external/user-ref.entity';
import {Comment} from '@/entities/local/comment.entity';
import {HashTag} from '@/entities/local/hashtag.entity';
import {NewsFeed} from '@/entities/local/newsfeed.entity';
import {Post} from '@/entities/local/post.entity';

import {SeedHandlerController} from './seed-handler';
import {Story} from '@/entities/local/story.entity';
import {Reaction} from '@/entities/local/reaction.entity';
import {LiveStreamHistory} from '@/entities/local/live-stream-history.entity';
import {Advertisement} from '@/entities/local/advertisement.entity';
import {Reel} from '@/entities/local/reel.entity';
import {PostAttachment} from '@/entities/local/post-attachment';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserReference,
            CommunityReference,
            NewsFeed,
            Post,
            Comment,
            HashTag,
            Story,
            Reaction,
            LiveStreamHistory,
            Advertisement,
            Reel,
            PostAttachment,
        ]),
    ],
    controllers: [SeedHandlerController],
})
export class SeederModule {}

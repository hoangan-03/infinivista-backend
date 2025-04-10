import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';

import {CommunityReference} from '@/entities/external/community-ref.entity';
import {UserReference} from '@/entities/external/user-ref.entity';
import {Advertisement} from '@/entities/local/advertisement.entity';
import {Comment} from '@/entities/local/comment.entity';
import {HashTag} from '@/entities/local/hashtag.entity';
import {LiveStreamHistory} from '@/entities/local/live-stream-history.entity';
import {NewsFeed} from '@/entities/local/newsfeed.entity';
import {Post} from '@/entities/local/post.entity';
import {PostAttachment} from '@/entities/local/post-attachment';
import {Reel} from '@/entities/local/reel.entity';
import {Story} from '@/entities/local/story.entity';

import {SeedHandlerController} from './seed-handler';

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
            LiveStreamHistory,
            Advertisement,
            Reel,
            PostAttachment,
        ]),
    ],
    controllers: [SeedHandlerController],
})
export class SeederModule {}

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
import {Topic} from '@/entities/local/topic.entity';
import {UserReactPost} from '@/entities/local/user-react-post.entity';
import {UserReactStory} from '@/entities/local/user-react-story.entity';
import {FileUploadService} from '@/services/file-upload.service';

import {UserReferenceModule} from '../user-reference/user-reference.module';
import {FeedController} from './feed.controller';
import {FeedService} from './feed.service';
@Module({
    imports: [
        TypeOrmModule.forFeature([
            Advertisement,
            Comment,
            HashTag,
            LiveStreamHistory,
            NewsFeed,
            PostAttachment,
            Post,
            Topic,
            Reel,
            Story,
            CommunityReference,
            UserReference,
            UserReactPost,
            UserReactStory,
        ]),
        UserReferenceModule,
    ],
    controllers: [FeedController],
    providers: [FeedService, FileUploadService],
    exports: [FeedService],
})
export class FeedModule {}

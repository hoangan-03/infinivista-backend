import {DataSource} from 'typeorm';

import {CommunityReference} from '@/entities/external/community-ref.entity';
import {UserReference} from '@/entities/external/user-reference.entity';
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

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5435,
    username: 'postgres',
    password: 'postgres',
    database: 'infinivista-feed',
    entities: [
        Advertisement,
        Comment,
        HashTag,
        LiveStreamHistory,
        NewsFeed,
        PostAttachment,
        Post,
        Reel,
        Story,
        UserReference,
        CommunityReference,
        UserReactPost,
        UserReactStory,
        Topic,
    ],
    migrations: ['migrations/*.ts'],
    synchronize: false,
    migrationsRun: true, // set to false in production
});

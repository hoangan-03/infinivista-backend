import {DataSource} from 'typeorm';

import {Advertisement} from '@/entities/local/advertisement.entity';
import {Comment} from '@/entities/local/comment.entity';
import {HashTag} from '@/entities/local/hashtag.entity';
import {LiveStreamHistory} from '@/entities/local/live-stream-history.entity';
import {NewsFeed} from '@/entities/local/news-feed.entity';
import {Post} from '@/entities/local/post.entity';
import {PostAttachment} from '@/entities/local/post-attachment';
import {Reaction} from '@/entities/local/reaction.entity';
import {Reel} from '@/entities/local/reel.entity';
import {Story} from '@/entities/local/story.entity';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5435,
    // host: 'db',
    // port: 5432,
    // For inside Docker container
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
        Reaction,
        Reel,
        Story,
    ],
    migrations: ['migrations/*.ts'],
    synchronize: true, // set to false in production
});

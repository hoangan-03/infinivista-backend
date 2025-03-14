import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';

import {Advertisement} from '@/entities/advertisement.entity';
import {BaseEntity} from '@/entities/base-class';
import {LiveStreamHistory} from '@/entities/live-stream-history.entity';
import {Post} from '@/entities/post.entity';
import {Reel} from '@/entities/reel.entity';
import {Story} from '@/entities/story.entity';
import {UserCommentsNewsFeed} from '@/entities/user-comments-news-feed.entity';
import {UserHasNewsFeed} from '@/entities/user-has-news-feed.entity';
import {UserReactsNewsFeed} from '@/entities/user-reacts-news-feed.entity';
import {UserSharesNewsFeed} from '@/entities/user-shares-news-feed.entity';
import {UserViewsNewsFeed} from '@/entities/user-views-news-feed.entity';

@Entity()
export class NewsFeed extends BaseEntity {
    @PrimaryGeneratedColumn()
    news_feed_id: number;

    @Column({type: 'text', nullable: true})
    description: string;

    @Column({type: 'enum', enum: ['public', 'friends only', 'private'], default: 'public'})
    visibility: string;

    @OneToMany(() => UserHasNewsFeed, (userHasNewsFeed) => userHasNewsFeed.newsFeed)
    userHasNewsFeed: UserHasNewsFeed[];

    @OneToMany(() => UserCommentsNewsFeed, (comments) => comments.newsFeed)
    comments: UserCommentsNewsFeed[];

    @OneToMany(() => UserSharesNewsFeed, (shares) => shares.newsFeed)
    shares: UserSharesNewsFeed[];

    @OneToMany(() => UserViewsNewsFeed, (views) => views.newsFeed)
    views: UserViewsNewsFeed[];

    @OneToMany(() => UserReactsNewsFeed, (reactions) => reactions.newsFeed)
    reactions: UserReactsNewsFeed[];

    @OneToMany(() => Reel, (reel) => reel.newsFeed)
    reels: Reel[];

    @OneToMany(() => Story, (story) => story.newsFeed)
    stories: Story[];

    @OneToMany(() => Post, (post) => post.newsFeed)
    posts: Post[];

    @OneToMany(() => LiveStreamHistory, (liveStream) => liveStream.newsFeed)
    liveStreams: LiveStreamHistory[];

    @OneToMany(() => Advertisement, (ad) => ad.newsFeed)
    advertisements: Advertisement[];
}

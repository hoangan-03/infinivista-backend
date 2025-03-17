import {Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {Advertisement} from '@/entities/local/advertisement.entity';
import {BaseEntity} from '@/entities/local/base-class';
import {LiveStreamHistory} from '@/entities/local/live-stream-history.entity';
import {Post} from '@/entities/local/post.entity';
import {Reel} from '@/entities/local/reel.entity';
import {Story} from '@/entities/local/story.entity';

import {CommunityReference} from '../external/community.entity';
import {UserReference} from '../external/user.entity';
import {Comment} from './comment.entity';
import {HashTag} from './hashtag.entity';
import {Reaction} from './reaction.entity';
// import {UserCommentsNewsFeed} from '@/entities/user-comments-news-feed.entity';
// import {UserHasNewsFeed} from '@/entities/user-has-news-feed.entity';
// import {UserReactsNewsFeed} from '@/entities/user-reacts-news-feed.entity';
// import {UserSharesNewsFeed} from '@/entities/user-shares-news-feed.entity';
// import {UserViewsNewsFeed} from '@/entities/user-views-news-feed.entity';

@Entity()
export class NewsFeed extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'text', nullable: true})
    description?: string;

    @Column({type: 'enum', enum: ['public', 'friends only', 'private'], default: 'public'})
    visibility: string;

    // @OneToMany(() => UserHasNewsFeed, (userHasNewsFeed) => userHasNewsFeed.newsFeed)
    // userHasNewsFeed: UserHasNewsFeed[];

    // @OneToMany(() => UserCommentsNewsFeed, (comments) => comments.newsFeed)
    // comments: UserCommentsNewsFeed[];

    // @OneToMany(() => UserSharesNewsFeed, (shares) => shares.newsFeed)
    // shares: UserSharesNewsFeed[];

    // @OneToMany(() => UserViewsNewsFeed, (views) => views.newsFeed)
    // views: UserViewsNewsFeed[];

    // @OneToMany(() => UserReactsNewsFeed, (reactions) => reactions.newsFeed)
    // reactions: UserReactsNewsFeed[];

    // @OneToMany(() => Reel, (reel) => reel.newsFeed)
    // reels: Reel[];
    @OneToOne(() => Reel, (reel) => reel.newsFeed, {nullable: true})
    @JoinColumn()
    reel?: Reel;

    // @OneToMany(() => Story, (story) => story.newsFeed)
    // stories: Story[];
    @OneToOne(() => Story, (story) => story.newsFeed, {nullable: true})
    @JoinColumn()
    story?: Story;

    // @OneToMany(() => Post, (post) => post.newsFeed)
    // posts: Post[];
    @OneToOne(() => Post, (post) => post.newsFeed, {nullable: true})
    @JoinColumn()
    post?: Post;

    // @OneToMany(() => LiveStreamHistory, (liveStream) => liveStream.newsFeed)
    // liveStreams: LiveStreamHistory[];
    @OneToOne(() => LiveStreamHistory, (liveStream) => liveStream.newsFeed, {nullable: true})
    @JoinColumn()
    liveStream?: LiveStreamHistory;

    // @OneToMany(() => Advertisement, (ad) => ad.newsFeed)
    // advertisements: Advertisement[];
    @OneToOne(() => Advertisement, (ad) => ad.newsFeed, {nullable: true})
    @JoinColumn()
    advertisement?: Advertisement;

    @OneToMany(() => Comment, (comment) => comment.newsFeed)
    comments: Comment[];

    @OneToMany(() => Reaction, (reaction) => reaction.newsFeed)
    reactions: Reaction[];

    @ManyToOne(() => CommunityReference, (community) => community.newsFeeds, {nullable: true})
    community?: CommunityReference;

    @ManyToOne(() => UserReference, (user) => user.newsFeeds)
    owner: UserReference;

    @ManyToMany(() => HashTag, (tag) => tag.newsFeeds)
    @JoinColumn()
    tags: HashTag[];

    @ManyToMany(() => UserReference, (user) => user.newsFeeds)
    @JoinColumn()
    taggedUsers: UserReference[];
}

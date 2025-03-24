import {Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {visibilityEnum} from '@/enums/feed-module/visibility.enum';

import {CommunityReference} from '../external/community.entity';
import {UserReference} from '../external/user.entity';
import {Advertisement} from './advertisement.entity';
import {BaseEntity} from './base-class';
import {HashTag} from './hashtag.entity';
import {LiveStreamHistory} from './live-stream-history.entity';
import {Post} from './post.entity';
import {Reaction} from './reaction.entity';
import {Reel} from './reel.entity';
import {Story} from './story.entity';

@Entity()
export class NewsFeed extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'text', nullable: true})
    description?: string;

    @Column({type: 'enum', enum: visibilityEnum, default: visibilityEnum.PUBLIC})
    visibility: visibilityEnum;

    @OneToOne(() => Reel, (reel) => reel.newsFeed, {nullable: true})
    @JoinColumn()
    reel?: Reel;

    @OneToMany(() => Story, (story) => story.newsFeed)
    stories: Story[];

    @OneToMany(() => Post, (post) => post.newsFeed)
    posts: Post[];

    @OneToMany(() => LiveStreamHistory, (liveStream) => liveStream.newsFeed)
    liveStreams: LiveStreamHistory[];

    @OneToMany(() => Advertisement, (ad) => ad.newsFeed)
    advertisements: Advertisement[];

    @OneToMany(() => Reaction, (reaction) => reaction.newsFeed)
    reactions: Reaction[];

    @ManyToOne(() => CommunityReference, (community) => community.newsFeeds, {nullable: true})
    community?: CommunityReference;

    @OneToOne(() => UserReference, (userRef) => userRef.newsFeed)
    owner: UserReference;

    @ManyToMany(() => HashTag, (tag) => tag.newsFeeds)
    @JoinColumn()
    tags: HashTag[];

    @ManyToMany(() => UserReference)
    @JoinColumn()
    taggedUsers: UserReference[];
}

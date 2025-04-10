import {Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {Advertisement} from '@/entities/local/advertisement.entity';
import {LiveStreamHistory} from '@/entities/local/live-stream-history.entity';
import {Post} from '@/entities/local/post.entity';
import {Reel} from '@/entities/local/reel.entity';
import {Story} from '@/entities/local/story.entity';
import {visibilityEnum} from '@/enum/visibility.enum';

import {CommunityReference} from '../external/community-ref.entity';
import {UserReference} from '../external/user-ref.entity';
import {HashTag} from './hashtag.entity';

@Entity()
export class NewsFeed extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

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

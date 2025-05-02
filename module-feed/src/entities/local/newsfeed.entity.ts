import {Column, Entity, JoinColumn, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {Advertisement} from '@/entities/local/advertisement.entity';
import {LiveStreamHistory} from '@/entities/local/live-stream-history.entity';
import {Post} from '@/entities/local/post.entity';
import {Reel} from '@/entities/local/reel.entity';
import {Story} from '@/entities/local/story.entity';
import {visibilityEnum} from '@/modules/feed/enum/visibility.enum';

import {UserReference} from '../external/user-reference.entity';
import {Group} from './group.entity';
import {HashTag} from './hashtag.entity';
import {Page} from './page.entity';

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

    @OneToOne(() => UserReference, (userRef) => userRef.newsFeed)
    @JoinColumn({name: 'owner_id'})
    owner: UserReference;

    @OneToOne(() => Page, (page) => page.newsFeed)
    @JoinColumn({name: 'page_owner_id'})
    pageOwner?: Page;

    @OneToOne(() => Group, (group) => group.newsFeed)
    @JoinColumn({name: 'group_owner_id'})
    groupOwner?: Group;

    @Column({name: 'owner_id', nullable: true})
    owner_id: string;

    @Column({name: 'page_owner_id', nullable: true})
    page_owner_id: string;

    @Column({name: 'group_owner_id', nullable: true})
    group_owner_id: string;

    @ManyToMany(() => HashTag, (tag) => tag.newsFeeds)
    @JoinColumn()
    tags: HashTag[];

    @ManyToMany(() => UserReference)
    @JoinColumn()
    taggedUsers: UserReference[];
}

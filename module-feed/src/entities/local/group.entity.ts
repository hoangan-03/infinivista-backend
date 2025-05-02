import {
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {groupVisibility} from '@/modules/feed/enum/group-visibility.enum';

import {UserReference} from '../external/user-reference.entity';
import {GroupRule} from './group-rule.entity';
import {NewsFeed} from './newsfeed.entity';

@Entity()
export class Group extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'text', nullable: false})
    name: string;

    @Column({type: 'text', nullable: true})
    description?: string;

    @OneToMany(() => GroupRule, (groupRule) => groupRule.group)
    groupRules: GroupRule[];

    @Column({nullable: true})
    profileImageUrl?: string;

    @Column({nullable: true})
    coverImageUrl?: string;

    @Column({nullable: true})
    city?: string;

    @Column({nullable: true})
    country?: string;

    @Column({type: 'enum', enum: groupVisibility, default: groupVisibility.PUBLIC})
    visibility: groupVisibility;

    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.id, {nullable: true})
    @JoinColumn({name: 'news_feed_id'})
    newsFeed?: NewsFeed;

    @Column({name: 'news_feed_id', nullable: true})
    news_feed_id: string;

    // Page owner
    @ManyToOne(() => UserReference, (userRef) => userRef.newsFeed)
    @JoinColumn({name: 'owner_id'})
    owner: UserReference;

    @Column({name: 'owner_id', nullable: true})
    owner_id: string;

    @ManyToMany(() => UserReference, (userRef) => userRef.memeberInGroups)
    @JoinTable()
    members: UserReference[];
}

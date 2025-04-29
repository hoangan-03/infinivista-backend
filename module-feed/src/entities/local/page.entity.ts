import {Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {PageCategoryEnum} from '@/modules/feed/enum/page-category.enum';

import {UserReference} from '../external/user-reference.entity';
import {NewsFeed} from './newsfeed.entity';

@Entity()
export class Page extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'text', nullable: false})
    name: string;

    @Column({type: 'text', nullable: true})
    description?: string;

    @Column({nullable: true})
    profileImageUrl?: string;

    @Column({nullable: true})
    coverImageUrl?: string;

    @Column({
        type: 'enum',
        enum: PageCategoryEnum,
        default: PageCategoryEnum.OTHER,
    })
    category: PageCategoryEnum;

    @Column({nullable: true})
    website?: string;

    @Column({nullable: true})
    email?: string;

    @Column({nullable: true})
    phoneNumber?: string;

    @Column({nullable: true})
    address?: string;

    @Column({nullable: true})
    city?: string;

    @Column({nullable: true})
    country?: string;

    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.id, {nullable: true})
    @JoinColumn({name: 'news_feed_id'})
    newsFeed?: NewsFeed;

    @Column({name: 'news_feed_id', nullable: true})
    news_feed_id: string;

    @ManyToOne(() => UserReference, (userRef) => userRef.newsFeed)
    @JoinColumn({name: 'owner_id'})
    owner: UserReference;

    @Column({name: 'owner_id', nullable: true})
    owner_id: string;

    @ManyToMany(() => UserReference, (userRef) => userRef.followedPages)
    @JoinTable()
    followers: UserReference[];
}

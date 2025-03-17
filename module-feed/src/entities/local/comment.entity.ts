import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {UserReference} from '../external/user.entity';
import {BaseEntity} from './base-class';
import {NewsFeed} from './news-feed.entity';

@Entity()
export class Comment extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    text: string;

    @Column()
    attachment_url: string;

    @ManyToOne(() => UserReference, (user) => user.comments)
    user: UserReference;

    @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.comments)
    newsFeed: NewsFeed;
}

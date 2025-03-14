import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base-class';
import {NewsFeed} from '@/entities/news-feed.entity';
@Entity()
export class Post extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    post_attachment: string;

    @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.posts)
    newsFeed: NewsFeed;
}

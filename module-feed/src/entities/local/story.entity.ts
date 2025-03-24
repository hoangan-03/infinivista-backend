import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/local/base-class';
import {NewsFeed} from '@/entities/local/news-feed.entity';

@Entity()
export class Story extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.stories)
    newsFeed: NewsFeed;
}

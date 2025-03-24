import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {NewsFeed} from './news-feed.entity';

@Entity()
export class Advertisement {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.advertisements)
    newsFeed: NewsFeed;
}

import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {NewsFeed} from './news-feed.entity';

@Entity()
export class UserSharesNewsFeed {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    shared_at: Date;

    @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.shares)
    newsFeed: NewsFeed;
}

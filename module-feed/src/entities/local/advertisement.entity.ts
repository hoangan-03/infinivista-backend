import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {NewsFeed} from '@/entities/local/news-feed.entity';

@Entity()
export class Advertisement {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'timestamp'})
    start_time: Date;

    @Column({type: 'timestamp'})
    end_time: Date;

    // @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.advertisements)
    // newsFeed: NewsFeed;
    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.advertisement)
    newsFeed: NewsFeed;
}

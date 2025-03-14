import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {NewsFeed} from './news-feed.entity';

@Entity()
export class LiveStreamHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'timestamp'})
    start_time: Date;

    @Column({type: 'timestamp'})
    end_time: Date;

    @Column()
    stream_url: string;

    @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.liveStreams)
    newsFeed: NewsFeed;
}

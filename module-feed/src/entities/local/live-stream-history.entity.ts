import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {NewsFeed} from './newsfeed.entity';

@Entity()
export class LiveStreamHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'timestamp'})
    start_time: Date;

    @Column({type: 'timestamp'})
    end_time: Date;

    @Column()
    stream_url: string;

    @Column()
    view_count: number;

    @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.liveStreams)
    newsFeed: NewsFeed;
}

import {Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {NewsFeed} from './news-feed.entity';

@Entity()
export class LiveStreamHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.liveStreams)
    newsFeed: NewsFeed;
}

import {Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {NewsFeed} from './news-feed.entity';

@Entity()
export class UserHasNewsFeed {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.userHasNewsFeed)
    newsFeed: NewsFeed;
}

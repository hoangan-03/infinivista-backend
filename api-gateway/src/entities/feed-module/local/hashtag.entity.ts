import {Column, Entity, ManyToMany, PrimaryGeneratedColumn} from 'typeorm';

import {NewsFeed} from './news-feed.entity';

@Entity()
export class HashTag {
    @PrimaryGeneratedColumn()
    id: string;

    @ManyToMany(() => NewsFeed, (newsFeed) => newsFeed.tags)
    newsFeeds: NewsFeed[];
}

import {Column, Entity, ManyToMany, PrimaryGeneratedColumn} from 'typeorm';

import {NewsFeed} from './newsfeed.entity';

@Entity()
export class HashTag {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    name: string;

    @ManyToMany(() => NewsFeed, (newsFeed) => newsFeed.tags)
    newsFeeds: NewsFeed[];
}

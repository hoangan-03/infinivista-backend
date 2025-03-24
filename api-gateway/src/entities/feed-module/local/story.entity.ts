import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from './base-class';
import {NewsFeed} from './news-feed.entity';

@Entity()
export class Story extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    story_url: string;

    @Column({type: 'int'})
    duration: number;

    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.stories)
    newsFeed: NewsFeed;
}

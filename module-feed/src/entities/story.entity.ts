import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base-class';
import {NewsFeed} from '@/entities/news-feed.entity';

@Entity()
export class Story extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    story_url: string;

    @Column({type: 'int'})
    duration: number;

    @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.stories)
    newsFeed: NewsFeed;
}

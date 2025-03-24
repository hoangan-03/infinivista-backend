import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from './base-class';
import {NewsFeed} from './news-feed.entity';
@Entity()
export class Reel extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    reel_video_url: string;

    @Column({type: 'int'})
    duration: number;

    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.reel)
    newsFeed: NewsFeed;
}

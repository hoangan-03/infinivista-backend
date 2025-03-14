import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base-class';
import {NewsFeed} from '@/entities/news-feed.entity';
@Entity()
export class Reel extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    reel_video_url: string;

    @Column({type: 'int'})
    duration: number;

    @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.reels)
    newsFeed: NewsFeed;
}

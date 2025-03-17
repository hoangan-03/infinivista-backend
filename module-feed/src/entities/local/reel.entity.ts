import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/local/base-class';
import {NewsFeed} from '@/entities/local/news-feed.entity';
@Entity()
export class Reel extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    reel_video_url: string;

    @Column({type: 'int'})
    duration: number;

    // @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.reels)
    // newsFeed: NewsFeed;
    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.reel)
    newsFeed: NewsFeed;
}

import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {NewsFeed} from '@/entities/local/newsfeed.entity';
@Entity()
export class Reel extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    reel_url: string;

    @Column()
    duration: number;

    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.reel)
    newsFeed: NewsFeed;
}

import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {NewsFeed} from '@/entities/local/newsfeed.entity';

@Entity()
export class Advertisement {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'timestamp'})
    start_time: Date;

    @Column({type: 'timestamp'})
    end_time: Date;

    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.advertisements)
    newsFeed: NewsFeed;
}

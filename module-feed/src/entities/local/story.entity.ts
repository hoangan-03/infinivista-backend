import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {NewsFeed} from '@/entities/local/newsfeed.entity';

@Entity()
export class Story extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column()
    story_url: string;

    @Column()
    duration: number;

    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.stories)
    newsFeed: NewsFeed;
}

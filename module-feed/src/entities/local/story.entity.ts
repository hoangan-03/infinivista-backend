import {Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {NewsFeed} from '@/entities/local/newsfeed.entity';

@Entity()
export class Story extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    story_url: string;

    @Column()
    duration: number;

    @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.stories)
    newsFeed: NewsFeed;
}

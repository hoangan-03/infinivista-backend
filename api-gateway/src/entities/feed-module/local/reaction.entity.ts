import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from './base-class';
import {NewsFeed} from './news-feed.entity';
@Entity()
export class Reaction extends BaseEntity {
    @PrimaryGeneratedColumn()
    reaction_id: number;

    @Column({type: 'enum', enum: ['LIKE', 'HEART', 'CARE', 'SAD', 'WOW', 'ANGRY']})
    reaction_type: string;

    @Column()
    reaction_image_url: string;

    @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.reactions)
    newsFeed: NewsFeed;
}

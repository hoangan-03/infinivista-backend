import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {ReactionType} from '@/enum/reaction-type';

import {NewsFeed} from './newsfeed.entity';
@Entity()
export class Reaction extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    reaction_id: number;

    @Column({type: 'enum', enum: ReactionType})
    reaction_type: ReactionType;

    @Column()
    reaction_image_url: string;

    @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.reactions)
    newsFeed: NewsFeed;
}

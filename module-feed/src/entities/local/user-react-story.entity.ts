import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {ReactionType} from '@/modules/feed/enum/reaction-type.enum';

import {UserReference} from '../external/user-reference.entity';
import {Story} from './story.entity';

@Entity('user_react_story')
export class UserReactStory extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'enum', enum: ReactionType})
    reactionType: ReactionType;

    @ManyToOne(() => UserReference)
    @JoinColumn({name: 'user_id'})
    user: UserReference;

    @Column({type: 'uuid'})
    user_id: string;

    @ManyToOne(() => Story, (story) => story.userReactions)
    @JoinColumn({name: 'story_id'})
    story: Story;

    @Column({type: 'uuid'})
    story_id: string;
}

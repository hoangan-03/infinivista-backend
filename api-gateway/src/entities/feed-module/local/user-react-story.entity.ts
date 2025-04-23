import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {ReactionType} from '@/enums/feed-module/reaction-type.enum';

import {UserReference} from '../external/user.entity';
import {Story} from './story.entity';

@Entity('user_react_story')
export class UserReactStory extends BaseEntity {
    id: string;

    reactionType: ReactionType;

    user: UserReference;

    user_id: string;

    story: Story;

    story_id: string;
}

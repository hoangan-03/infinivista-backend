import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {ReactionType} from '@/modules/feed/enum/reaction-type.enum';

import {UserReference} from '../external/user-reference.entity';
import {Post} from './post.entity';

@Entity('user_react_post')
export class UserReactPost extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'enum', enum: ReactionType})
    reactionType: ReactionType;

    @ManyToOne(() => UserReference)
    @JoinColumn({name: 'user_id'})
    user: UserReference;

    @Column({type: 'uuid'})
    user_id: string;

    @ManyToOne(() => Post, (post) => post.userReactions)
    @JoinColumn({name: 'post_id'})
    post: Post;

    @Column({type: 'uuid'})
    post_id: string;
}

import {Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';

import {UserReference} from '../external/user-ref.entity';
import {Post} from './post.entity';
import {Reaction} from './reaction.entity';

@Entity('user_react_post')
@Unique(['user_id', 'post_id']) // Ensures a user can only have one reaction per post
export class UserReactPost extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Reaction, {nullable: true})
    @JoinColumn({name: 'reaction_id'})
    reaction: Reaction;

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

import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';

import {UserReference} from '../external/user-reference.entity';
import {Post} from './post.entity';

@Entity('user_share_post')
export class UserSharePost extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => UserReference)
    @JoinColumn({name: 'user_id'})
    user: UserReference;

    @Column({type: 'uuid'})
    user_id: string;

    @ManyToOne(() => Post, (post) => post.userShares)
    @JoinColumn({name: 'post_id'})
    post: Post;

    @Column({type: 'uuid'})
    post_id: string;
}

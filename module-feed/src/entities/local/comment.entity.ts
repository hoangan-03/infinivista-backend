import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';

import {UserReference} from '../external/user-ref.entity';
import {Post} from './post.entity';

@Entity()
export class Comment extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'text', nullable: false})
    text: string;

    @Column({nullable: true})
    attachment_url?: string;

    @ManyToOne(() => UserReference, (user) => user.comments)
    user: UserReference;

    @ManyToOne(() => Post, (post) => post.comments)
    post: Post;
}

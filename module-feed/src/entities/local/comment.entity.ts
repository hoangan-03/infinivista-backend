import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {UserReference} from '../external/user.entity';
import {BaseEntity} from './base-class';
import {Post} from './post.entity';

@Entity()
export class Comment extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    text: string;

    @Column()
    attachment_url: string;

    @ManyToOne(() => UserReference, (user) => user.comments)
    user: UserReference;

    @ManyToOne(() => Post, (post) => post.comments)
    post: Post;
}

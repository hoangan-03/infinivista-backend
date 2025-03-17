import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {Post} from './post.entity';

@Entity()
export class PostAttachment {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    attachment_url: string;

    @ManyToOne(() => Post, (post) => post.postAttachments)
    post: Post;
}

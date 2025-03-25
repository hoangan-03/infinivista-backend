import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {NewsFeed} from '@/entities/local/newsfeed.entity';

import {Comment} from './comment.entity';
import {PostAttachment} from './post-attachment';
@Entity()
export class Post extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column({type: 'text', nullable: false})
    content: string;

    @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.posts)
    newsFeed: NewsFeed;

    @OneToMany(() => Comment, (comment) => comment.post)
    comments: Comment[];

    @OneToMany(() => PostAttachment, (postAttachment) => postAttachment.post)
    postAttachments: PostAttachment[];
}

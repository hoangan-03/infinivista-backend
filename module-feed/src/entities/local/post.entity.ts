import {Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/local/base-class';
import {NewsFeed} from '@/entities/local/news-feed.entity';

import {Comment} from './comment.entity';
import {PostAttachment} from './post-attachment';
@Entity()
export class Post extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.posts)
    newsFeed: NewsFeed;

    @OneToMany(() => Comment, (comment) => comment.post)
    comments: Comment[];

    @OneToMany(() => PostAttachment, (postAttachment) => postAttachment.post)
    postAttachments: PostAttachment[];
}

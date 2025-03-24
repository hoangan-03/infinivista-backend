import {Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from './base-class';
import {Comment} from './comment.entity';
import {NewsFeed} from './news-feed.entity';
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

import {Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/local/base-class';
import {NewsFeed} from '@/entities/local/news-feed.entity';

import {PostAttachment} from './post-attachment';
@Entity()
export class Post extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    post_attachment: string;

    // @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.posts)
    // newsFeed: NewsFeed;
    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.post)
    newsFeed: NewsFeed;

    @OneToMany(() => PostAttachment, (postAttachment) => postAttachment.post)
    postAttachments: PostAttachment[];
}

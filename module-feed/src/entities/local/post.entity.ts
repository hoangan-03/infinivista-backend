import {Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {NewsFeed} from '@/entities/local/newsfeed.entity';
import {visibilityEnum} from '@/modules/feed/enum/visibility.enum';

import {UserReference} from '../external/user-reference.entity';
import {Comment} from './comment.entity';
import {PostAttachment} from './post-attachment';
import {Topic} from './topic.entity';
import {UserReactPost} from './user-react-post.entity';
import {UserSharePost} from './user-share-post.entity';

@Entity()
export class Post extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'text', nullable: false})
    content: string;

    @Column({type: 'enum', enum: visibilityEnum, default: visibilityEnum.PUBLIC})
    visibility: visibilityEnum;

    @ManyToOne(() => UserReference, (userRef) => userRef.posts)
    @JoinColumn({name: 'owner_id'})
    owner: UserReference;

    @Column({name: 'owner_id', nullable: true})
    owner_id: string;

    @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.posts)
    newsFeed: NewsFeed;

    @OneToMany(() => Comment, (comment) => comment.post)
    comments: Comment[];

    @OneToMany(() => PostAttachment, (postAttachment) => postAttachment.post)
    postAttachments: PostAttachment[];

    @OneToMany(() => UserReactPost, (userReaction) => userReaction.post)
    userReactions: UserReactPost[];

    @OneToMany(() => UserSharePost, (userShare) => userShare.post)
    userShares: UserSharePost[];

    @ManyToMany(() => Topic)
    @JoinTable({
        name: 'post_topics',
        joinColumn: {
            name: 'post_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'topic_id',
            referencedColumnName: 'id',
        },
    })
    topics: Topic[];
}

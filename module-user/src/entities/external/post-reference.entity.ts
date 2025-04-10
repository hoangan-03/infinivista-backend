// import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from 'typeorm';

// import {BaseEntity} from '@/entities/base/base-class';
// import {NewsFeed} from '@/entities/local/newsfeed.entity';

// import {Comment} from './comment.entity';
// import {PostAttachment} from './post-attachment';
// import {UserReactPost} from './user-react-post.entity';

// @Entity()
// export class Post extends BaseEntity {
//     @PrimaryGeneratedColumn('uuid')
//     id: string;

//     @Column({type: 'text', nullable: false})
//     content: string;

//     @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.posts)
//     newsFeed: NewsFeed;

//     @OneToMany(() => Comment, (comment) => comment.post)
//     comments: Comment[];

//     @OneToMany(() => PostAttachment, (postAttachment) => postAttachment.post)
//     postAttachments: PostAttachment[];

//     @OneToMany(() => UserReactPost, (userReaction) => userReaction.post)
//     UserReactPosts: UserReactPost[];

//     @OneToMany(() => UserReactPost, (userReaction) => userReaction.post)
//     userReactions: UserReactPost[];
// }

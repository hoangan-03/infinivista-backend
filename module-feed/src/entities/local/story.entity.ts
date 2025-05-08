import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {NewsFeed} from '@/entities/local/newsfeed.entity';
import {AttachmentType} from '@/modules/feed/enum/attachment-type.enum';

import {Comment} from './comment.entity';
import {UserReactStory} from './user-react-story.entity';

@Entity()
export class Story extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    story_url: string;

    @Column()
    thumbnail_url: string;

    @Column()
    duration: number;

    @Column({type: 'enum', enum: AttachmentType, nullable: false})
    attachmentType: AttachmentType;

    @ManyToOne(() => NewsFeed, (newsFeed) => newsFeed.stories)
    newsFeed: NewsFeed;

    @OneToMany(() => Comment, (comment) => comment.post)
    comments: Comment[];

    @OneToMany(() => UserReactStory, (userReaction) => userReaction.story)
    userReactions: UserReactStory[];
}

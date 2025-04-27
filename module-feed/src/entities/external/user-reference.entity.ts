import {Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn} from 'typeorm';

import {Comment} from '../local/comment.entity';
import {NewsFeed} from '../local/newsfeed.entity';

@Entity('user_references')
export class UserReference {
    @PrimaryColumn()
    id: string;

    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.owner, {cascade: true})
    @JoinColumn({name: 'news_feed_id'})
    newsFeed: NewsFeed;

    @OneToMany(() => Comment, (comment) => comment.user)
    comments: Comment[];

    @Column({type: 'varchar', length: 255, unique: true})
    email: string;

    @Column({type: 'varchar', length: 255, unique: true})
    username: string;

    @Column({type: 'varchar', length: 15, nullable: true})
    phoneNumber: string;

    @Column({type: 'varchar', length: 255, nullable: true})
    firstName: string;

    @Column({type: 'varchar', length: 255, nullable: true})
    lastName: string;

    @Column({type: 'text', nullable: true})
    profileImageUrl: string;
}

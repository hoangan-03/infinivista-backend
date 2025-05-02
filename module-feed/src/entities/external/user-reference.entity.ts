import {Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryColumn} from 'typeorm';

import {Comment} from '../local/comment.entity';
import {Group} from '../local/group.entity';
import {NewsFeed} from '../local/newsfeed.entity';
import {Page} from '../local/page.entity';
import {Post} from '../local/post.entity';

@Entity('user_references')
export class UserReference {
    @PrimaryColumn('uuid')
    id: string;

    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.owner, {cascade: true})
    @JoinColumn({name: 'news_feed_id'})
    newsFeed: NewsFeed;

    @ManyToMany(() => Page, (page) => page.followers, {cascade: true})
    @JoinTable()
    followedPages: Page[];

    @ManyToMany(() => Group, (group) => group.members, {cascade: true})
    @JoinTable()
    memeberInGroups: Group[];

    @OneToMany(() => Comment, (comment) => comment.user)
    comments: Comment[];

    @OneToMany(() => Post, (post) => post.owner)
    posts: Post[];

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

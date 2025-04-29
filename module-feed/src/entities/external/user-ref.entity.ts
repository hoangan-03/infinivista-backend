import {Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryColumn} from 'typeorm';

import {Comment} from '../local/comment.entity';
import {Group} from '../local/group.entity';
import {NewsFeed} from '../local/newsfeed.entity';
import {Page} from '../local/page.entity';

@Entity('user_references')
export class UserReference {
    @PrimaryColumn()
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

    email: string;

    username: string;

    phoneNumber: string;

    firstName: string;

    lastName: string;

    profileImageUrl: string;
}

import {Entity, JoinColumn, ManyToMany, OneToMany, OneToOne, PrimaryColumn} from 'typeorm';

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

    @ManyToMany(() => UserReference, (userRef) => userRef.memberInGroups)
    memberInGroups: UserReference[];

    @ManyToMany(() => UserReference, (userRef) => userRef.followedPages)
    followedPages: UserReference[];
}

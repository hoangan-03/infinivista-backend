import {Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn} from 'typeorm';

import {Comment} from '../local/comment.entity';
import {NewsFeed} from '../local/news-feed.entity';

@Entity('user_references')
export class UserReference {
    @PrimaryColumn()
    id: string;

    @OneToOne(() => NewsFeed, (newsFeed) => newsFeed.owner, {cascade: true})
    @JoinColumn({name: 'news_feed_id'})
    newsFeed: NewsFeed;

    @OneToMany(() => Comment, (comment) => comment.user)
    comments: Comment[];
}

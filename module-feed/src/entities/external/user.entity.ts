import {Entity, OneToMany, PrimaryColumn} from 'typeorm';

import {Comment} from '../local/comment.entity';
import {NewsFeed} from '../local/news-feed.entity';

@Entity()
export class UserReference {
    @PrimaryColumn()
    id: string;

    @OneToMany(() => NewsFeed, (newsFeed) => newsFeed.owner)
    newsFeeds: NewsFeed[];

    @OneToMany(() => Comment, (comment) => comment.user)
    comments: Comment[];
}

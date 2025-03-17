import {Entity, OneToMany} from 'typeorm';

import {NewsFeed} from '../local/news-feed.entity';

@Entity()
export class CommunityReference {
    id: string;

    @OneToMany(() => NewsFeed, (newsFeed) => newsFeed.community)
    newsFeeds: NewsFeed[];
}

import {Entity, OneToMany, PrimaryColumn} from 'typeorm';

import {NewsFeed} from '../local/newsfeed.entity';

@Entity()
export class CommunityReference {
    @PrimaryColumn()
    id: string;

    @OneToMany(() => NewsFeed, (newsFeed) => newsFeed.community)
    newsFeeds: NewsFeed[];
}

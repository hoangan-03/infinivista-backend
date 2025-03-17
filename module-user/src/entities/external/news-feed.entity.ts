import {Entity, ManyToMany, PrimaryColumn} from 'typeorm';

import {User} from '../local/user.entity';

@Entity()
export class NewsFeedReference {
    @PrimaryColumn()
    id: string;

    @ManyToMany(() => User, (user) => user.sharedNewsFeeds)
    sharedUsers: User[];
}

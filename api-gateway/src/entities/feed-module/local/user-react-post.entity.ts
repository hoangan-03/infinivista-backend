import {BaseEntity} from '@/entities/base/base-class';

import {UserReference} from '../external/user.entity';
import {Post} from './post.entity';
import {Reaction} from './reaction.entity';

export class UserReactPost extends BaseEntity {
    id: string;

    reaction: Reaction;

    user: UserReference;

    user_id: string;

    post: Post;

    post_id: string;
}

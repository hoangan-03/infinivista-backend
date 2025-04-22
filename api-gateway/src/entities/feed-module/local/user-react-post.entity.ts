import {BaseEntity} from '@/entities/base/base-class';
import {ReactionType} from '@/enums/feed-module/reaction-type.enum';

import {UserReference} from '../external/user.entity';
import {Post} from './post.entity';

export class UserReactPost extends BaseEntity {
    id: string;

    reactionType: ReactionType;

    user: UserReference;

    user_id: string;

    post: Post;

    post_id: string;
}

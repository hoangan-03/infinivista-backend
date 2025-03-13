import {User} from './user.entity';

export class BlockedUser {
    id: string;

    user_id: string;

    user: User;

    blocked_user_id: string;

    blockedUser: User;

    created_at: Date;
}

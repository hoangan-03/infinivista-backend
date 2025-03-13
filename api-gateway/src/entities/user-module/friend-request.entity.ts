import {FriendStatus} from '@/enums/user-module/friend-status.enum';

import {BaseEntity} from './base-class';
import {User} from './user.entity';

export class FriendRequest extends BaseEntity {
    id: string;

    sender: User;

    sender_id: string;

    recipient: User;

    recipient_id: string;

    status: FriendStatus;
}

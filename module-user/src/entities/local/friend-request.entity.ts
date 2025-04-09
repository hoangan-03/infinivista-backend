import {BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {FriendStatus} from '@/modules/user/enums/friend-status.enum';

import {User} from './user.entity';

@Entity({name: 'friend_requests'})
export class FriendRequest extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.sentFriendRequests)
    @JoinColumn({name: 'sender_id'})
    sender: User;

    @Column({type: 'uuid'})
    sender_id: string;

    @ManyToOne(() => User, (user) => user.receivedFriendRequests)
    @JoinColumn({name: 'recipient_id'})
    recipient: User;

    @Column({type: 'uuid'})
    recipient_id: string;

    @Column({
        type: 'enum',
        enum: FriendStatus,
        default: FriendStatus.PENDING,
    })
    status: FriendStatus;
}

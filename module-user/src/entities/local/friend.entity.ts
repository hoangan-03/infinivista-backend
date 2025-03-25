import {BaseEntity, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {User} from './user.entity';

@Entity({name: 'friends'})
export class Friend extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.friends)
    @JoinColumn({name: 'user_id'})
    user: User;

    @ManyToOne(() => User)
    @JoinColumn({name: 'friend_id'})
    friend: User;
}

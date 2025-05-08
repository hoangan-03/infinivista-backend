import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from './base-class';
import {User} from './user.entity';

@Entity({name: 'user_follows'})
export class UserFollow extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.following)
    @JoinColumn({name: 'follower_id'})
    follower: User;

    @Column({type: 'uuid'})
    follower_id: string;

    @ManyToOne(() => User, (user) => user.followers)
    @JoinColumn({name: 'following_id'})
    following: User;

    @Column({type: 'uuid'})
    following_id: string;
}

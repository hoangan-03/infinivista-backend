import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique} from 'typeorm';

import {BaseEntity} from '@/entities/local/base-class';

import {User} from '../local/user.entity';

@Entity('user_react_post')
@Unique(['user_id', 'post_id']) // Ensures a user can only have one reaction per post
export class UserReactPost extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({name: 'user_id'})
    user: User;

    @Column({type: 'uuid'})
    user_id: string;
}

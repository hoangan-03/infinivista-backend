// import {BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from './base-class';
import {User} from './user.entity';

// import {User} from './user.entity';

export class Friend extends BaseEntity {
    id: string;

    user: User;

    user_id: string;

    friend: User;

    friend_id: string;

    group: string;
}

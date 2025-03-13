import {Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '@/entities/base-class';
import {User} from '@/entities/user.entity';

@Entity({name: 'user_status'})
export class UserStatus extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, (user) => user.status, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({name: 'user_id'})
    user: User;

    @Column({type: 'uuid'})
    user_id: string;

    @Column({type: 'boolean', default: false})
    isOnline: boolean;

    @Column({type: 'boolean', default: false})
    isSuspended: boolean;

    @Column({type: 'boolean', default: false})
    isDeleted: boolean;
}

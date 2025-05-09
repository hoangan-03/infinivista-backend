import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '../base/base-class';
import {UserReference} from '../external/user-reference.entity';
import {Group} from './group.entity';

@Entity()
export class GroupApplicant extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Group, (group) => group.applicants)
    @JoinColumn({name: 'group_id'})
    group: Group;

    @Column({name: 'group_id'})
    group_id: string;

    @ManyToOne(() => UserReference)
    @JoinColumn({name: 'user_id'})
    user: UserReference;

    @Column({name: 'user_id'})
    user_id: string;

    @Column({default: false})
    isVerified: boolean;

    @Column({type: 'text', nullable: true})
    message?: string;
}

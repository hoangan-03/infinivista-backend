import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '../base/base-class';
import {UserReference} from '../external/user-reference.entity';

@Entity()
export class CallHistory extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    call_id: string;

    @Column({type: 'timestamp'})
    start_time: Date;

    @Column({type: 'timestamp'})
    end_time: Date;

    @ManyToOne(() => UserReference, (user) => user.incomingCallHistories, {onDelete: 'SET NULL'})
    caller: UserReference;

    @ManyToOne(() => UserReference, (user) => user.outcomingCallHistories)
    receiver: UserReference;
}

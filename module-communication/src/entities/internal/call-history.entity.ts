import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {CallStatus} from '@/modules/calling/enums/call-status.enum';

import {BaseEntity} from '../base/base-class';
import {UserReference} from '../external/user-reference.entity';

@Entity()
export class CallHistory extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    call_id: string;

    @Column({type: 'timestamp'})
    start_time: Date;

    @Column({type: 'timestamp', nullable: true})
    end_time?: Date;

    @Column({type: 'timestamp', nullable: true})
    accepted_at?: Date;

    @Column({
        type: 'enum',
        enum: CallStatus,
        default: CallStatus.ACCEPTED,
    })
    status: CallStatus;

    @ManyToOne(() => UserReference, (user) => user.incomingCallHistories, {onDelete: 'SET NULL'})
    caller: UserReference;

    @ManyToOne(() => UserReference, (user) => user.outcomingCallHistories)
    receiver: UserReference;
}

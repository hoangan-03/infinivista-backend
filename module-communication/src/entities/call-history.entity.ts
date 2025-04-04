import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {UserReference} from './external/user.entity';

@Entity()
export class CallHistory {
    @PrimaryGeneratedColumn('uuid')
    call_id: string;

    @Column({type: 'timestamp'})
    start_time: Date;

    @Column({type: 'timestamp'})
    end_time: Date;

    get durationInSeconds(): number {
        return (this.end_time.getTime() - this.start_time.getTime()) / 1000;
    }

    @ManyToOne(() => UserReference, (user) => user.incomingCallHistories, {onDelete: 'SET NULL'})
    caller: UserReference;

    @ManyToOne(() => UserReference, (user) => user.outcomingCallHistories)
    receiver: UserReference;
}

import {Entity, ManyToOne} from 'typeorm';

import {UserReference} from '../external/user.entity';

@Entity()
export class CallHistory {
    call_id: string;

    start_time: Date;

    end_time: Date;

    @ManyToOne(() => UserReference, (user) => user.incomingCallHistories, {onDelete: 'SET NULL'})
    caller: UserReference;

    @ManyToOne(() => UserReference, (user) => user.outcomingCallHistories)
    receiver: UserReference;
}

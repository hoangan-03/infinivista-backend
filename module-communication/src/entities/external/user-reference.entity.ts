import {Entity, OneToMany, PrimaryColumn} from 'typeorm';

import {CallHistory} from '../internal/call-history.entity';
import {Message} from '../internal/message.entity';

@Entity()
export class UserReference {
    @PrimaryColumn()
    id: string;

    @OneToMany(() => Message, (message) => message.sender)
    sentMessages: Message[];

    @OneToMany(() => Message, (message) => message.receiver)
    receivedMessages: Message[];

    @OneToMany(() => CallHistory, (call) => call.caller)
    outcomingCallHistories: CallHistory[];

    @OneToMany(() => CallHistory, (call) => call.receiver)
    incomingCallHistories: CallHistory[];
}

import {Entity, ManyToMany, OneToMany, PrimaryColumn} from 'typeorm';

import {CallHistory} from '../internal/call-history.entity';
import {GroupChat} from '../internal/group-chat.entity';
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

    @ManyToMany(() => GroupChat, (groupChat) => groupChat.users)
    groupChats: GroupChat[];

    @OneToMany(() => CallHistory, (call) => call.receiver)
    incomingCallHistories: CallHistory[];
}

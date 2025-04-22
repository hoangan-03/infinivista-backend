import {Entity, ManyToMany, OneToMany, PrimaryColumn} from 'typeorm';

import {CallHistory} from '../internal/call-history.entity';
import {GroupChat} from '../internal/group-chat.entity';
import {GroupChatAttachment} from '../internal/group-chat-attachment.entity';
import {GroupChatMessage} from '../internal/group-chat-message.entity';
import {Message} from '../internal/message.entity';
import {MessageAttachment} from '../internal/message-attachment.entity';

@Entity()
export class UserReference {
    @PrimaryColumn()
    id: string;

    @OneToMany(() => Message, (message) => message.sender)
    sentMessages: Message[];

    @OneToMany(() => Message, (message) => message.receiver)
    receivedMessages: Message[];

    @OneToMany(() => MessageAttachment, (messageAttachment) => messageAttachment.sender)
    sentAttachments: MessageAttachment[];

    @OneToMany(() => MessageAttachment, (messageAttachment) => messageAttachment.receiver)
    receivedAttachments: MessageAttachment[];

    @OneToMany(() => CallHistory, (callHistory) => callHistory.caller)
    incomingCallHistories: CallHistory[];

    @OneToMany(() => CallHistory, (callHistory) => callHistory.receiver)
    outcomingCallHistories: CallHistory[];

    @OneToMany(() => GroupChatMessage, (groupChatMessage) => groupChatMessage.sender)
    sentGroupChatMessages: GroupChatMessage[];

    @OneToMany(() => GroupChatAttachment, (groupChatAttachment) => groupChatAttachment.sender)
    sentGroupChatAttachments: GroupChatAttachment[];

    @ManyToMany(() => GroupChat, (groupChat) => groupChat.users)
    groupChats: GroupChat[];

    email: string;

    username: string;

    phoneNumber: string;

    firstName: string;

    lastName: string;

    profileImageUrl: string;
}

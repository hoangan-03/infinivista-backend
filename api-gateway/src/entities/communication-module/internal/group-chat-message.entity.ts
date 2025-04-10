import {Entity, JoinColumn, ManyToOne, OneToMany, OneToOne} from 'typeorm';

import {EmoteIcon} from '@/enums/communication-module/emote-icon.enum';
import {MessageStatus} from '@/enums/communication-module/message-status.enum';

import {UserReference} from '../external/user.entity';
import {GroupChat} from './group-chat.entity';
import {MessageAttachment} from './message-attachment.entity';
import {MessageText} from './message-text.entity';

@Entity()
export class GroupChatMessage {
    id: string;

    sent_at?: Date;

    delete_at?: Date;

    last_modified_at?: Date;

    status: MessageStatus;

    emotion?: EmoteIcon[];

    @OneToOne(() => MessageText, (messageText) => messageText.message, {nullable: true, onDelete: 'CASCADE'})
    @JoinColumn()
    textMessage?: MessageText;

    @OneToMany(() => MessageAttachment, (messageAttachment) => messageAttachment.message, {
        nullable: true,
        cascade: true,
    })
    attachment?: MessageAttachment[];

    @ManyToOne(() => UserReference, (sender) => sender.sentMessages)
    sender: UserReference;

    @ManyToOne(() => GroupChat, (groupChat) => groupChat.messages)
    groupChat: GroupChat;
}

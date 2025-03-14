import {Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {EmoteIcon} from '@/modules/messaging/enums/emote-icon.enum';
import {MessageStatus} from '@/modules/messaging/enums/message-status.enum';
import {MessageType} from '@/modules/messaging/enums/message-type.enum';

import {MessageAttachment} from './message-attachment.entity';
import {MessageText} from './message-text.entity';
import {UserMessagesGroupChat} from './user-messages-group-chat.entity';
import {UserMessagesUser} from './user-messages-user.entity';

@Entity()
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'timestamp', nullable: true})
    sent_at?: Date;

    @Column({type: 'timestamp', nullable: true})
    seen_at?: Date;

    @Column({type: 'timestamp', nullable: true})
    delete_at?: Date;

    @Column({type: 'timestamp', nullable: true})
    last_modified_at?: Date;

    @Column({type: 'enum', enum: MessageStatus, nullable: false})
    status: MessageStatus;

    @Column({type: 'enum', enum: EmoteIcon, nullable: true})
    emotion?: EmoteIcon;

    @Column({type: 'enum', enum: MessageType, nullable: false})
    type: MessageType;

    @OneToOne(() => MessageText, (messageText) => messageText.message, {nullable: true})
    @JoinColumn()
    textMessage?: MessageText;

    @OneToOne(() => MessageAttachment, (messageAttachment) => messageAttachment.message, {nullable: true})
    @JoinColumn()
    attachment?: MessageAttachment;

    @OneToOne(() => UserMessagesUser, (userMessage) => userMessage.message, {nullable: true})
    @JoinColumn()
    userMessages?: UserMessagesUser;

    @OneToOne(() => UserMessagesGroupChat, (groupMessage) => groupMessage.message, {nullable: true})
    @JoinColumn()
    groupMessages?: UserMessagesGroupChat;
}

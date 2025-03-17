import {Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {EmoteIcon} from '@/modules/messaging/enums/emote-icon.enum';
import {MessageStatus} from '@/modules/messaging/enums/message-status.enum';

import {UserReference} from './external/user.entity';
import {GroupChat} from './group-chat.entity';
import {MessageAttachment} from './message-attachment.entity';
import {MessageText} from './message-text.entity';

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

    @ManyToOne(() => UserReference, (receiver) => receiver.receivedMessages)
    receiver: UserReference;

    @ManyToOne(() => GroupChat, (groupChat) => groupChat.messages)
    groupChat: GroupChat;
}

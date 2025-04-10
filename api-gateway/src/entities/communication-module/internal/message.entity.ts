import {Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {EmoteIcon} from '@/enums/communication-module/emote-icon.enum';
import {MessageStatus} from '@/enums/communication-module/message-status.enum';
import {MessageType} from '@/enums/communication-module/message-type.enum';

import {UserReference} from '../external/user.entity';
import {MessageAttachment} from './message-attachment.entity';
import {MessageText} from './message-text.entity';

@Entity()
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    sent_at?: Date;

    seen_at?: Date;

    delete_at?: Date;

    last_modified_at?: Date;

    status: MessageStatus;

    type: MessageType;

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
}

import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {EmoteIcon} from '@/modules/messaging/enums/emote-icon.enum';
import {MessageStatus} from '@/modules/messaging/enums/message-status.enum';

import {BaseEntity} from '../base/base-class';
import {UserReference} from '../external/user-reference.entity';
import {GroupChat} from './group-chat.entity';

@Entity()
export class GroupChatMessage extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'timestamp', nullable: true})
    sent_at?: Date;

    @Column({type: 'timestamp', nullable: true})
    delete_at?: Date;

    @Column({type: 'timestamp', nullable: true})
    last_modified_at?: Date;

    @Column({type: 'enum', enum: MessageStatus, nullable: false})
    status: MessageStatus;

    @Column({type: 'simple-array', nullable: true})
    emotion?: EmoteIcon[];

    @Column({nullable: false, default: 'Default message'})
    textMessage?: string;

    @ManyToOne(() => UserReference, (sender) => sender.sentMessages)
    sender: UserReference;

    @ManyToOne(() => GroupChat, (groupChat) => groupChat.messages)
    groupChat: GroupChat;
}

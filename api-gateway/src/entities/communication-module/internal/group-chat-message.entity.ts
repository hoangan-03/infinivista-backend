import {ApiProperty} from '@nestjs/swagger';
import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {EmoteIcon} from '@/enums/communication-module/emote-icon.enum';
import {MessageStatus} from '@/enums/communication-module/message-status.enum';

import {BaseEntity} from '../../base/base-class';
import {UserReference} from '../external/user-reference.entity';
import {GroupChat} from './group-chat.entity';

@Entity()
export class GroupChatMessage extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the group chat message',
        example: '550e8400-e29b-41d4-a716-446655440000',
        readOnly: true,
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        description: 'Timestamp when the message was sent to the group',
        example: '2023-08-15T14:30:00Z',
        type: Date,
        required: false,
    })
    @Column({type: 'timestamp', nullable: true})
    sent_at?: Date;

    @ApiProperty({
        description: 'Timestamp when the message was deleted or scheduled for deletion',
        example: '2023-09-15T00:00:00Z',
        type: Date,
        required: false,
    })
    @Column({type: 'timestamp', nullable: true})
    delete_at?: Date;

    @ApiProperty({
        description: 'Timestamp when the message was last modified',
        example: '2023-08-15T15:10:22Z',
        type: Date,
        required: false,
    })
    @Column({type: 'timestamp', nullable: true})
    last_modified_at?: Date;

    @ApiProperty({
        description: 'Current status of the group message',
        enum: MessageStatus,
        enumName: 'MessageStatus',
        example: MessageStatus.SENT,
        required: true,
    })
    @Column({type: 'enum', enum: MessageStatus, nullable: false})
    status: MessageStatus;

    @ApiProperty({
        description: 'Emotions/reactions from group members to this message',
        enum: EmoteIcon,
        enumName: 'EmoteIcon',
        isArray: true,
        example: [EmoteIcon.LIKE, EmoteIcon.HEART],
        required: false,
    })
    @Column({type: 'simple-array', nullable: true})
    emotion?: EmoteIcon[];

    @ApiProperty({
        description: 'The text content of the message',
        example: 'Has everyone confirmed their attendance for the trip?',
        type: String,
        required: false,
        default: 'Default message',
    })
    @Column({type: 'string', nullable: false, default: 'Default message'})
    textMessage?: string;

    @ApiProperty({
        description: 'The user who sent the message to the group',
        type: () => UserReference,
    })
    @ManyToOne(() => UserReference, (sender) => sender.sentMessages)
    sender: UserReference;

    @ApiProperty({
        description: 'The group chat this message belongs to',
        type: () => GroupChat,
    })
    @ManyToOne(() => GroupChat, (groupChat) => groupChat.messages)
    groupChat: GroupChat;
}

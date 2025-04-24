import {ApiProperty} from '@nestjs/swagger';
import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {EmoteIcon} from '@/enums/communication-module/emote-icon.enum';
import {MessageStatus} from '@/enums/communication-module/message-status.enum';
import {AttachmentType} from '@/enums/feed-module/attachment-type.enum';

import {BaseEntity} from '../../base/base-class';
import {UserReference} from '../external/user-reference.entity';
import {GroupChat} from './group-chat.entity';

@Entity()
export class GroupChatAttachment extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the group chat attachment',
        example: '550e8400-e29b-41d4-a716-446655440000',
        readOnly: true,
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        description: 'Timestamp when the attachment was sent to the group',
        example: '2023-08-15T14:30:00Z',
        type: Date,
        required: false,
    })
    @Column({type: 'timestamp', nullable: true})
    sent_at?: Date;

    @ApiProperty({
        description: 'Timestamp when the attachment was deleted or scheduled for deletion',
        example: '2023-09-15T00:00:00Z',
        type: Date,
        required: false,
    })
    @Column({type: 'timestamp', nullable: true})
    delete_at?: Date;

    @ApiProperty({
        description: 'Current status of the attachment',
        enum: MessageStatus,
        enumName: 'MessageStatus',
        example: MessageStatus.SENT,
        required: true,
    })
    @Column({type: 'enum', enum: MessageStatus, nullable: false})
    status: MessageStatus;

    @ApiProperty({
        description: 'Emotions/reactions from group members to this attachment',
        enum: EmoteIcon,
        enumName: 'EmoteIcon',
        isArray: true,
        example: [EmoteIcon.HEART, EmoteIcon.WOW],
        required: false,
    })
    @Column({type: 'simple-array', nullable: true})
    emotion?: EmoteIcon[];

    @ApiProperty({
        description: 'URL to the attachment resource',
        example: 'https://storage.infinivista.com/group-attachments/trip-itinerary.pdf',
        required: true,
    })
    @Column()
    attachment_url: string;

    @ApiProperty({
        description: 'Name of the attachment file',
        example: 'trip-itinerary.pdf',
        required: false,
    })
    @Column({nullable: true})
    attachment_name?: string;

    @ApiProperty({
        description: 'Type of attachment content',
        enum: AttachmentType,
        enumName: 'AttachmentType',
        example: AttachmentType.IMAGE,
        required: true,
    })
    @Column({type: 'enum', enum: AttachmentType, nullable: false})
    attachmentType: AttachmentType;

    @ApiProperty({
        description: 'The user who sent the attachment to the group',
        type: () => UserReference,
    })
    @ManyToOne(() => UserReference, (sender) => sender.sentMessages)
    sender: UserReference;

    @ApiProperty({
        description: 'The group chat this attachment belongs to',
        type: () => GroupChat,
    })
    @ManyToOne(() => GroupChat, (groupChat) => groupChat.messages)
    groupChat: GroupChat;
}

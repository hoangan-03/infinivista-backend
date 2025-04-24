import {ApiProperty} from '@nestjs/swagger';
import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {EmoteIcon} from '@/enums/communication-module/emote-icon.enum';
import {MessageStatus} from '@/enums/communication-module/message-status.enum';
import {AttachmentType} from '@/enums/feed-module/attachment-type.enum';

import {BaseEntity} from '../../base/base-class';
import {UserReference} from '../external/user-reference.entity';

@Entity()
export class MessageAttachment extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the message attachment',
        example: '550e8400-e29b-41d4-a716-446655440000',
        readOnly: true,
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        description: 'URL to the attachment resource',
        example: 'https://storage.infinivista.com/attachments/image123.jpg',
        required: true,
    })
    @Column()
    attachment_url: string;

    @ApiProperty({
        description: 'Name of the attachment file',
        example: 'vacation-photo.jpg',
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
        description: 'Timestamp when the attachment was sent',
        example: '2023-08-15T14:30:00Z',
        type: Date,
        required: false,
    })
    @Column({type: 'timestamp', nullable: true})
    sent_at?: Date;

    @ApiProperty({
        description: 'Timestamp when the attachment was seen by the recipient',
        example: '2023-08-15T14:32:45Z',
        type: Date,
        required: false,
    })
    @Column({type: 'timestamp', nullable: true})
    seen_at?: Date;

    @ApiProperty({
        description: 'Timestamp when the attachment was deleted or scheduled for deletion',
        example: '2023-09-15T00:00:00Z',
        type: Date,
        required: false,
    })
    @Column({type: 'timestamp', nullable: true})
    delete_at?: Date;

    @ApiProperty({
        description: 'Current status of the attachment message',
        enum: MessageStatus,
        enumName: 'MessageStatus',
        example: MessageStatus.SENT,
        required: true,
    })
    @Column({type: 'enum', enum: MessageStatus, nullable: false})
    status: MessageStatus;

    @ApiProperty({
        description: 'Emotion/reaction attached to the message attachment',
        enum: EmoteIcon,
        enumName: 'EmoteIcon',
        example: EmoteIcon.LIKE,
        required: false,
    })
    @Column({type: 'enum', enum: EmoteIcon, nullable: true})
    emotion?: EmoteIcon;

    @ApiProperty({
        description: 'The user who sent the attachment',
        type: () => UserReference,
    })
    @ManyToOne(() => UserReference, (sender) => sender.sentMessages)
    sender: UserReference;

    @ApiProperty({
        description: 'The user who received the attachment',
        type: () => UserReference,
    })
    @ManyToOne(() => UserReference, (receiver) => receiver.receivedMessages)
    receiver: UserReference;
}

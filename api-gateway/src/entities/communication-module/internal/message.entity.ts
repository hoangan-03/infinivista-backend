import {ApiProperty} from '@nestjs/swagger';
import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {EmoteIcon} from '@/enums/communication-module/emote-icon.enum';
import {MessageStatus} from '@/enums/communication-module/message-status.enum';

import {BaseEntity} from '../../base/base-class';
import {UserReference} from '../external/user-reference.entity';

@Entity()
export class Message extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the message',
        example: '550e8400-e29b-41d4-a716-446655440000',
        readOnly: true,
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        description: 'Timestamp when the message was sent',
        example: '2023-08-15T14:30:00Z',
        type: Date,
        required: false,
    })
    @Column({type: 'timestamp', nullable: true})
    sent_at?: Date;

    @ApiProperty({
        description: 'Timestamp when the message was seen by the recipient',
        example: '2023-08-15T14:32:45Z',
        type: Date,
        required: false,
    })
    @Column({type: 'timestamp', nullable: true})
    seen_at?: Date;

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
        description: 'Current status of the message',
        enum: MessageStatus,
        enumName: 'MessageStatus',
        example: MessageStatus.SENT,
        required: true,
    })
    @Column({type: 'enum', enum: MessageStatus, nullable: false})
    status: MessageStatus;

    @ApiProperty({
        description: 'Emotion/reaction attached to the message',
        enum: EmoteIcon,
        enumName: 'EmoteIcon',
        example: EmoteIcon.LIKE,
        required: false,
    })
    @Column({type: 'enum', enum: EmoteIcon, nullable: true})
    emotion?: EmoteIcon;

    @ApiProperty({
        description: 'The text content of the message',
        example: 'Hello, how are you doing today?',
        type: String,
        required: true,
    })
    @Column({type: 'string', nullable: false, default: 'Defaault message'})
    messageText: string;

    @ApiProperty({
        description: 'The user who sent the message',
        type: () => UserReference,
    })
    @ManyToOne(() => UserReference, (sender) => sender.sentMessages)
    sender: UserReference;

    @ApiProperty({
        description: 'The user who received the message',
        type: () => UserReference,
    })
    @ManyToOne(() => UserReference, (receiver) => receiver.receivedMessages)
    receiver: UserReference;
}

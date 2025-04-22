import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {EmoteIcon} from '@/enums/communication-module/emote-icon.enum';
import {MessageStatus} from '@/enums/communication-module/message-status.enum';
import {AttachmentType} from '@/enums/feed-module/attachment-type.enum';

import {BaseEntity} from '../../base/base-class';
import {UserReference} from '../external/user-reference.entity';

@Entity()
export class MessageAttachment extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    attachment_url: string;

    @Column({nullable: true})
    attachment_name?: string;

    @Column({type: 'enum', enum: AttachmentType, nullable: false})
    attachmentType: AttachmentType;

    @Column({type: 'timestamp', nullable: true})
    sent_at?: Date;

    @Column({type: 'timestamp', nullable: true})
    seen_at?: Date;

    @Column({type: 'timestamp', nullable: true})
    delete_at?: Date;

    @Column({type: 'enum', enum: MessageStatus, nullable: false})
    status: MessageStatus;

    @Column({type: 'enum', enum: EmoteIcon, nullable: true})
    emotion?: EmoteIcon;

    @ManyToOne(() => UserReference, (sender) => sender.sentMessages)
    sender: UserReference;

    @ManyToOne(() => UserReference, (receiver) => receiver.receivedMessages)
    receiver: UserReference;
}

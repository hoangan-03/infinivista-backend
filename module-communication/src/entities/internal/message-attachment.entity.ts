import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {EmoteIcon} from '@/modules/messaging/enums/emote-icon.enum';
import {MessageStatus} from '@/modules/messaging/enums/message-status.enum';

import {BaseEntity} from '../base/base-class';
import {UserReference} from '../external/user-reference.entity';

@Entity()
export class MessageAttachment extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    attachment_url: string;

    @Column({nullable: true})
    attachment_name?: string;

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

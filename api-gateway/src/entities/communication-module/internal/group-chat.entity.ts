import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '../../base/base-class';
import {UserReference} from '../external/user-reference.entity';
import {GroupChatAttachment} from './group-chat-attachment.entity';
import {GroupChatMessage} from './group-chat-message.entity';

@Entity()
export class GroupChat extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    group_chat_id: string;

    @Column()
    group_name: string;

    @Column({nullable: true})
    group_image_url: string;

    @OneToMany(() => GroupChatMessage, (message) => message.groupChat)
    messages: GroupChatMessage[];

    @OneToMany(() => GroupChatAttachment, (attachment) => attachment.groupChat)
    attachments: GroupChatAttachment[];

    @OneToMany(() => UserReference, (user) => user.groupChat)
    users: UserReference[];
}

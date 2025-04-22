import {Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '../base/base-class';
import {UserReference} from '../external/user-reference.entity';
import {GroupChatAttachment} from './group-chat-attachment.entity';
import {GroupChatMessage} from './group-chat-message.entity';

@Entity()
export class GroupChat extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    group_chat_id: string;

    @Column({type: 'varchar', length: 255})
    group_name: string;

    @Column({nullable: true})
    group_image_url: string;

    @OneToMany(() => GroupChatMessage, (message) => message.groupChat)
    messages: GroupChatMessage[];

    @OneToMany(() => GroupChatAttachment, (attachment) => attachment.groupChat)
    attachments: GroupChatAttachment[];

    @ManyToMany(() => UserReference, (user) => user.groupChats)
    @JoinTable({
        name: 'group_chat_users',
        joinColumn: {
            name: 'groupChatGroupChatId',
            referencedColumnName: 'group_chat_id',
        },
        inverseJoinColumn: {
            name: 'userReferenceId',
            referencedColumnName: 'id',
        },
    })
    users: UserReference[];
}

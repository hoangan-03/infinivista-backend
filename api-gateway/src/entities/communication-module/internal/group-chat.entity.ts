import {ApiProperty} from '@nestjs/swagger';
import {Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn} from 'typeorm';

import {BaseEntity} from '../../base/base-class';
import {UserReference} from '../external/user-reference.entity';
import {GroupChatAttachment} from './group-chat-attachment.entity';
import {GroupChatMessage} from './group-chat-message.entity';

@Entity()
export class GroupChat extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the group chat',
        example: '550e8400-e29b-41d4-a716-446655440000',
        readOnly: true,
    })
    @PrimaryGeneratedColumn('uuid')
    group_chat_id: string;

    @ApiProperty({
        description: 'Name of the group chat',
        example: 'Weekend Trip Planning',
        required: true,
    })
    @Column()
    group_name: string;

    @ApiProperty({
        description: 'URL to the group chat avatar/image',
        example: 'https://storage.infinivista.com/group-images/weekend-trip.jpg',
        required: false,
    })
    @Column({nullable: true})
    group_image_url: string;

    @ApiProperty({
        description: 'Messages sent in this group chat',
        type: () => [GroupChatMessage],
        isArray: true,
    })
    @OneToMany(() => GroupChatMessage, (message) => message.groupChat)
    messages: GroupChatMessage[];

    @ApiProperty({
        description: 'Attachments shared in this group chat',
        type: () => [GroupChatAttachment],
        isArray: true,
    })
    @OneToMany(() => GroupChatAttachment, (attachment) => attachment.groupChat)
    attachments: GroupChatAttachment[];

    @ApiProperty({
        description: 'Users who are members of this group chat',
        type: () => [UserReference],
        isArray: true,
    })
    @ManyToMany(() => UserReference, (user) => user.groupChats)
    users: UserReference[];
}

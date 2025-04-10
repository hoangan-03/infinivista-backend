import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';

import {GroupChatMessage} from './group-chat-message.entity';

@Entity()
export class GroupChat {
    @PrimaryGeneratedColumn('uuid')
    group_chat_id: string;

    @Column()
    group_name: string;

    @Column({nullable: true})
    group_image_url: string;

    @OneToMany(() => GroupChatMessage, (message) => message.groupChat)
    messages: GroupChatMessage[];
}

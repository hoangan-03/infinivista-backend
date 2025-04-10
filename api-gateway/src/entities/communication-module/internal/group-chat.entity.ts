import {Entity, OneToMany} from 'typeorm';

import {GroupChatMessage} from './group-chat-message.entity';

@Entity()
export class GroupChat {
    group_chat_id: string;

    group_name: string;

    group_image_url: string;

    @OneToMany(() => GroupChatMessage, (message) => message.groupChat)
    messages: GroupChatMessage[];
}

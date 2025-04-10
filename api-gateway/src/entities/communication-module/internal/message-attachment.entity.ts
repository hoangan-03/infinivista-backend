import { Entity, ManyToOne} from 'typeorm';

import {Message} from './message.entity';

@Entity()
export class MessageAttachment {
    id: string;

    attachment_url: string;

    attachment_name: string;

    @ManyToOne(() => Message, (message) => message.attachment, {onDelete: 'CASCADE'})
    message: Message;
}

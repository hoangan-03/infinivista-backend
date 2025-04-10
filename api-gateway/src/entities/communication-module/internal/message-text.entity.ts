import {Entity, OneToOne} from 'typeorm';

import {Message} from './message.entity';

@Entity()
export class MessageText {
    id: string;

    text: string;

    @OneToOne(() => Message, (message) => message.textMessage)
    message: Message;
}

import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from 'typeorm';

import {Message} from './message.entity';

@Entity()
export class MessageText {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'text'})
    text: string;

    @OneToOne(() => Message, (message) => message.textMessage)
    message: Message;
}

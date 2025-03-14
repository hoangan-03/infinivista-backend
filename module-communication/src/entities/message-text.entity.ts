import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {Message} from './message.entity';

@Entity()
export class MessageText {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'text'})
    text: string;

    @ManyToOne(() => Message, (message) => message.textMessage, {onDelete: 'CASCADE'})
    message: Message;
}

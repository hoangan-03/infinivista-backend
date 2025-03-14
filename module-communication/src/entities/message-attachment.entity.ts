import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';

import {Message} from './message.entity';

@Entity()
export class MessageAttachment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    attachment_url: string;

    @Column()
    attachment_name: string;

    @ManyToOne(() => Message, (message) => message.attachment, {onDelete: 'CASCADE'})
    message: Message;
}

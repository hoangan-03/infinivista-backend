import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';

import {Message} from './message.entity';

@Entity()
export class GroupChat {
    @PrimaryGeneratedColumn()
    group_chat_id: number;

    @Column()
    group_name: string;

    @Column({nullable: true})
    group_image_url: string;

    @OneToMany(() => Message, (message) => message.groupChat)
    messages: Message[];
}

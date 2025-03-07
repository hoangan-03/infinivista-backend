import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserMessagesGroupChat } from './user-messages-group-chat.entity';

@Entity()
export class GroupChat {
  @PrimaryGeneratedColumn()
  group_chat_id: number;

  @Column()
  group_name: string;

  @Column({ nullable: true })
  group_image_url: string;

  @OneToMany(() => UserMessagesGroupChat, (groupMessage) => groupMessage.groupChat)
  groupMessages: UserMessagesGroupChat[];
}

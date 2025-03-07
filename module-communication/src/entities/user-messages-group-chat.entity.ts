import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Message } from './message.entity';
import { GroupChat } from './group-chat.entity';

@Entity()
export class UserMessagesGroupChat {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Message, (message) => message.groupMessages, { onDelete: 'CASCADE' })
  message: Message;

  @ManyToOne(() => GroupChat, (groupChat) => groupChat.groupMessages, { onDelete: 'CASCADE' })
  groupChat: GroupChat;
}

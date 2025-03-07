import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Message } from './message.entity';

@Entity()
export class UserMessagesUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Message, (message) => message.userMessages, { onDelete: 'CASCADE' })
  message: Message;
}

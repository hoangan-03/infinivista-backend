import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { EmoteIcon } from "@/modules/messaging/enums/emote-icon.enum"; 
import { MessageText } from "./message-text.entity";
import { MessageAttachment } from "./message-attachment.entity";
import { UserMessagesUser } from "./user-messages-user.entity";
import { UserMessagesGroupChat } from "./user-messages-group-chat.entity";

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  message_id: number;

  @Column({ type: "timestamp", nullable: true })
  sent_at: Date;

  @Column({ type: "timestamp", nullable: true })
  seen_at: Date;

  @Column({ type: "boolean", default: false })
  is_seen: boolean;

  @Column({ type: "boolean", default: false })
  is_deleted: boolean;

  @Column({ type: "boolean", default: false })
  is_hidden: boolean;

  @Column({ type: "enum", enum: ["text", "attachment"] })
  emotion: EmoteIcon;

  @OneToMany(() => MessageText, (messageText) => messageText.message)
  textMessages: MessageText[];

  @OneToMany(
    () => MessageAttachment,
    (messageAttachment) => messageAttachment.message
  )
  attachments: MessageAttachment[];

  @OneToMany(() => UserMessagesUser, (userMessage) => userMessage.message)
  userMessages: UserMessagesUser[];

  @OneToMany(
    () => UserMessagesGroupChat,
    (groupMessage) => groupMessage.message
  )
  groupMessages: UserMessagesGroupChat[];
}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MessagingController } from "./messaging.controller";
import { MessagingService } from "./messaging.service";
import { CallHistories } from "@/entities/call-histories.entity";
import { GroupChat } from "@/entities/group-chat.entity";
import { MessageAttachment } from "@/entities/message-attachment.entity";
import { MessageText } from "@/entities/message-text.entity";
import { Message } from "@/entities/message.entity";
import { UserMessagesUser } from "@/entities/user-messages-user.entity";
import { UserMessagesGroupChat } from "@/entities/user-messages-group-chat.entity";
@Module({
  imports: [TypeOrmModule.forFeature([CallHistories, GroupChat, MessageAttachment, MessageText, Message, UserMessagesUser, UserMessagesGroupChat])],
  controllers: [MessagingController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}

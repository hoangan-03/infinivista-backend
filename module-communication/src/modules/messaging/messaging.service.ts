import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {UserReference} from '@/entities/external/user-reference.entity';
import {GroupChat} from '@/entities/internal/group-chat.entity';
import {GroupChatAttachment} from '@/entities/internal/group-chat-attachment.entity';
import {GroupChatMessage} from '@/entities/internal/group-chat-message.entity';
import {Message} from '@/entities/internal/message.entity';
import {MessageAttachment} from '@/entities/internal/message-attachment.entity';

import {CreateMessageDto} from './dto/create-message.dto';
import {EmoteIcon} from './enums/emote-icon.enum';
import {MessageStatus} from './enums/message-status.enum';

@Injectable()
export class MessagingService {
    constructor(
        @InjectRepository(Message) private messageRepository: Repository<Message>,
        @InjectRepository(UserReference) private UserReferenceRepository: Repository<UserReference>,
        @InjectRepository(MessageAttachment) private messageAttachmentRepository: Repository<MessageAttachment>,
        @InjectRepository(GroupChatMessage) private groupChatMessageRepository: Repository<GroupChatMessage>,
        @InjectRepository(GroupChatAttachment) private groupChatAttachmentRepository: Repository<GroupChatAttachment>,
        @InjectRepository(GroupChat) private groupChatRepository: Repository<GroupChat>
    ) {}

    async createMessage(message: Message): Promise<Message> {
        return await this.messageRepository.save(message);
    }

    async getMessages(): Promise<Message[]> {
        return await this.messageRepository.find({
            relations: ['textMessage'],
        });
    }

    async getMessageById(messageId: string): Promise<Message> {
        const message = await this.messageRepository.findOne({
            where: {id: messageId},
            relations: ['textMessage'],
        });

        if (!message) {
            throw new NotFoundException(`Message with ID ${messageId} not found`);
        }

        return message;
    }

    async dropEmote(emotion: EmoteIcon, messageId: string): Promise<Message> {
        const message = await this.getMessageById(messageId);
        message.emotion = emotion;
        return await this.messageRepository.save(message);
    }

    async hiddenMessage(messageId: string): Promise<void> {
        const message = await this.getMessageById(messageId);
        message.status = MessageStatus.HIDDEN;
        await this.messageRepository.save(message);
    }

    async deleteMessage(messageId: string): Promise<void> {
        const message = await this.getMessageById(messageId);
        message.status = MessageStatus.DELETED;
        await this.messageRepository.save(message);
    }

    async updateMessage(messageId: string, text: string): Promise<Message> {
        const message = await this.messageRepository.findOne({
            where: {id: messageId},
            relations: ['messageText'],
        });
        if (!message) {
            throw new NotFoundException(`Message with ID ${messageId} not found`);
        }
        message.messageText = text;
        message.last_modified_at = new Date();
        return await this.messageRepository.save(message);
    }

    async createTextMessage(senderId: string, createMessageDto: CreateMessageDto): Promise<Message> {
        const sender = await this.UserReferenceRepository.findOne({where: {id: senderId}});
        const recipient = await this.UserReferenceRepository.findOne({where: {id: createMessageDto.recipientId}});
        if (!sender) {
            throw new NotFoundException(`Sender with ID ${senderId} not found`);
        }
        if (!recipient) {
            throw new NotFoundException(`Recipient with ID ${createMessageDto.recipientId} not found`);
        }
        const message = this.messageRepository.create({
            sender: sender,
            receiver: recipient,
            status: MessageStatus.SENT,
            sent_at: new Date(),
            messageText: createMessageDto.messageText || 'Default message',
            last_modified_at: new Date(),
        });
        return this.messageRepository.save(message);
    }

    async createAttachmentMessage(
        senderId: string,
        recipientId: string,
        attachmentUrl: string,
        attachmentName?: string
    ): Promise<MessageAttachment> {
        const sender = await this.UserReferenceRepository.findOne({where: {id: senderId}});
        const recipient = await this.UserReferenceRepository.findOne({where: {id: recipientId}});
        if (!sender) {
            throw new NotFoundException(`Sender with ID ${senderId} not found`);
        }
        if (!recipient) {
            throw new NotFoundException(`Recipient with ID ${recipientId} not found`);
        }

        const message = this.messageAttachmentRepository.create({
            attachment_url: attachmentUrl,
            attachment_name: attachmentName || 'Default attachment name',
            sender: sender,
            receiver: recipient,
            status: MessageStatus.SENT,
            sent_at: new Date(),
        });
        return this.messageAttachmentRepository.save(message);
    }
}

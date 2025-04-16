import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {UserReference} from '@/entities/external/user-reference.entity';
import {GroupChat} from '@/entities/internal/group-chat.entity';
import {GroupChatAttachment} from '@/entities/internal/group-chat-attachment.entity';
import {GroupChatMessage} from '@/entities/internal/group-chat-message.entity';
import {Message} from '@/entities/internal/message.entity';
import {MessageAttachment} from '@/entities/internal/message-attachment.entity';
import {PaginationResponseInterface} from '@/interfaces/pagination-response.interface';

import {AttachmentMessageDto} from './dto/attachment-message.dto';
import {CreateMessageDto} from './dto/create-message.dto';
import {EmoteReactionDto} from './dto/emote-reaction.dto';
import {UpdateMessageDto} from './dto/update-message.dto';
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

    async getMessages(page = 1, limit = 10): Promise<PaginationResponseInterface<Message>> {
        const [messages, total] = await this.messageRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: {
                sent_at: 'DESC',
            },
            relations: ['sender', 'receiver'],
        });

        return {
            data: messages,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getMessageById(messageId: string): Promise<Message> {
        const message = await this.messageRepository.findOne({
            where: {id: messageId},
            relations: ['sender', 'receiver'],
        });

        if (!message) {
            throw new NotFoundException(`Message with ID ${messageId} not found`);
        }

        return message;
    }

    async dropEmoteInAConversation(messageId: string, emotion: EmoteReactionDto, currentId: string): Promise<Message> {
        const message = await this.getMessageById(messageId);
        if (!message) {
            throw new NotFoundException(`Message with ID ${messageId} not found`);
        }
        if (message.status === MessageStatus.HIDDEN) {
            throw new BadRequestException('Message already hidden');
        }
        if (message.status === MessageStatus.DELETED) {
            throw new BadRequestException('Message already deleted');
        }
        if (currentId !== message.receiver.id) {
            throw new BadRequestException('You can only react to your recipient messages');
        }
        message.emotion = emotion.emotion;
        return await this.messageRepository.save(message);
    }

    async markMessageAsSeen(messageId: string, currentId: string): Promise<Message> {
        const message = await this.getMessageById(messageId);
        if (!message) {
            throw new NotFoundException(`Message with ID ${messageId} not found`);
        }
        if (message.status === MessageStatus.HIDDEN) {
            throw new BadRequestException('Message already hidden');
        }
        if (message.status === MessageStatus.DELETED) {
            throw new BadRequestException('Message already deleted');
        }
        if (message.status === MessageStatus.SEEN) {
            throw new BadRequestException('Message already seen');
        }
        if (currentId !== message.receiver.id) {
            throw new BadRequestException('You can only mark your recipient messages as seen');
        }
        message.status = MessageStatus.SEEN;
        message.seen_at = new Date();
        return await this.messageRepository.save(message);
    }

    async hiddenMessage(messageId: string): Promise<{success: boolean}> {
        const message = await this.getMessageById(messageId);
        if (!message) {
            throw new NotFoundException(`Message with ID ${messageId} not found`);
        }
        if (message.status === MessageStatus.HIDDEN) {
            throw new BadRequestException('Message already hidden');
        }
        if (message.status === MessageStatus.DELETED) {
            throw new BadRequestException('Message already deleted');
        }
        message.status = MessageStatus.HIDDEN;
        await this.messageRepository.save(message);
        return {success: true};
    }

    // Can only delete own messages and in a time limit of 24h
    async deleteMessage(messageId: string, currentId: string): Promise<{success: boolean}> {
        const message = await this.getMessageById(messageId);

        if (!message) {
            throw new NotFoundException(`Message with ID ${messageId} not found`);
        }

        if (message.status === MessageStatus.HIDDEN) {
            throw new BadRequestException('Message already hidden');
        }

        if (message.status === MessageStatus.DELETED) {
            throw new BadRequestException('Message already deleted');
        }

        if (!message.sender) {
            throw new BadRequestException('Message sender information not available');
        }

        if (message.sender.id !== currentId) {
            throw new BadRequestException('You can only delete your own messages');
        }

        // Check if the message is within the 24-hour time limit
        const messageTime = new Date(message.createdAt!).getTime();
        const currentTime = new Date().getTime();
        const hoursDifference = (currentTime - messageTime) / (1000 * 60 * 60);

        if (hoursDifference > 24) {
            throw new BadRequestException('Messages can only be deleted within 24 hours of sending');
        }

        message.status = MessageStatus.DELETED;
        message.delete_at = new Date();
        await this.messageRepository.save(message);
        return {success: true};
    }

    async updateMessage(messageId: string, updateMessageDto: UpdateMessageDto): Promise<Message> {
        const message = await this.messageRepository.findOne({
            where: {id: messageId},
        });
        if (!message) {
            throw new NotFoundException(`Message with ID ${messageId} not found`);
        }
        message.messageText = updateMessageDto.messageText;
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

    async getMessagesFromConversation(
        currentId: string,
        targetId: string,
        page = 1,
        limit = 10
    ): Promise<PaginationResponseInterface<Message>> {
        const [messages, total] = await this.messageRepository.findAndCount({
            where: [
                {sender: {id: currentId}, receiver: {id: targetId}},
                {sender: {id: targetId}, receiver: {id: currentId}},
            ],
            skip: (page - 1) * limit,
            take: limit,
            order: {
                sent_at: 'DESC',
            },
            relations: ['sender', 'receiver'],
        });

        if (total === 0 && page === 1) {
            return {
                data: [],
                metadata: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0,
                },
            };
        }

        return {
            data: messages,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // Change reaction emote on a message
    async changeEmote(messageId: string, emotion: EmoteReactionDto, currentId: string): Promise<Message> {
        const message = await this.getMessageById(messageId);
        if (!message) {
            throw new NotFoundException(`Message with ID ${messageId} not found`);
        }
        if (message.status === MessageStatus.HIDDEN || message.status === MessageStatus.DELETED) {
            throw new BadRequestException(`Cannot react to a ${message.status.toLowerCase()} message`);
        }
        if (currentId !== message.receiver.id) {
            throw new BadRequestException('You can only react to messages sent to you');
        }
        message.emotion = emotion.emotion;
        return await this.messageRepository.save(message);
    }

    // Remove reaction emote from a message
    async removeEmote(messageId: string, currentId: string): Promise<Message> {
        const message = await this.getMessageById(messageId);
        if (!message) {
            throw new NotFoundException(`Message with ID ${messageId} not found`);
        }
        if (message.status === MessageStatus.HIDDEN || message.status === MessageStatus.DELETED) {
            throw new BadRequestException(`Cannot modify a ${message.status.toLowerCase()} message`);
        }
        if (currentId !== message.receiver.id) {
            throw new BadRequestException('You can only remove reactions from messages sent to you');
        }
        message.emotion = undefined;
        return await this.messageRepository.save(message);
    }

    // Create attachment message
    async createAttachmentMessageFromDto(
        senderId: string,
        attachmentMessageDto: AttachmentMessageDto
    ): Promise<MessageAttachment> {
        return this.createAttachmentMessage(
            senderId,
            attachmentMessageDto.recipientId,
            attachmentMessageDto.attachmentUrl,
            attachmentMessageDto.attachmentName
        );
    }

    // Delete a message attachment
    async deleteAttachment(attachmentId: string, currentId: string): Promise<{success: boolean}> {
        const attachment = await this.getAttachmentById(attachmentId);

        if (!attachment.sender) {
            throw new BadRequestException('Message sender information not available');
        }

        if (attachment.sender.id !== currentId) {
            throw new BadRequestException('You can only delete your own attachments');
        }

        // Check if the message is within the 24-hour time limit
        const messageTime = new Date(attachment.createdAt!).getTime();
        const currentTime = new Date().getTime();
        const hoursDifference = (currentTime - messageTime) / (1000 * 60 * 60);

        if (hoursDifference > 24) {
            throw new BadRequestException('Attachments can only be deleted within 24 hours of sending');
        }

        attachment.status = MessageStatus.DELETED;
        attachment.delete_at = new Date();
        await this.messageAttachmentRepository.save(attachment);
        return {success: true};
    }

    // Mark attachment as seen
    async markAttachmentAsSeen(attachmentId: string, currentId: string): Promise<MessageAttachment> {
        const attachment = await this.getAttachmentById(attachmentId);

        if (attachment.status === MessageStatus.HIDDEN || attachment.status === MessageStatus.DELETED) {
            throw new BadRequestException(`Cannot mark a ${attachment.status.toLowerCase()} attachment as seen`);
        }
        if (attachment.status === MessageStatus.SEEN) {
            throw new BadRequestException('Attachment already marked as seen');
        }
        if (currentId !== attachment.receiver.id) {
            throw new BadRequestException('You can only mark attachments sent to you as seen');
        }

        attachment.status = MessageStatus.SEEN;
        attachment.seen_at = new Date();
        return await this.messageAttachmentRepository.save(attachment);
    }

    // Add/change reaction to attachment
    async addReactionToAttachment(
        attachmentId: string,
        emotion: EmoteReactionDto,
        currentId: string
    ): Promise<MessageAttachment> {
        const attachment = await this.getAttachmentById(attachmentId);

        if (attachment.status === MessageStatus.HIDDEN || attachment.status === MessageStatus.DELETED) {
            throw new BadRequestException(`Cannot react to a ${attachment.status.toLowerCase()} attachment`);
        }
        if (currentId !== attachment.receiver.id) {
            throw new BadRequestException('You can only react to attachments sent to you');
        }

        attachment.emotion = emotion.emotion;
        return await this.messageAttachmentRepository.save(attachment);
    }

    // Remove reaction from attachment
    async removeReactionFromAttachment(attachmentId: string, currentId: string): Promise<MessageAttachment> {
        const attachment = await this.getAttachmentById(attachmentId);

        if (attachment.status === MessageStatus.HIDDEN || attachment.status === MessageStatus.DELETED) {
            throw new BadRequestException(`Cannot modify a ${attachment.status.toLowerCase()} attachment`);
        }
        if (currentId !== attachment.receiver.id) {
            throw new BadRequestException('You can only remove reactions from attachments sent to you');
        }

        attachment.emotion = undefined;
        return await this.messageAttachmentRepository.save(attachment);
    }

    // Get attachment by ID
    async getAttachmentById(attachmentId: string): Promise<MessageAttachment> {
        const attachment = await this.messageAttachmentRepository.findOne({
            where: {id: attachmentId},
            relations: ['sender', 'receiver'],
        });

        if (!attachment) {
            throw new NotFoundException(`Attachment with ID ${attachmentId} not found`);
        }

        return attachment;
    }

    // Get all attachments from a conversation
    async getAttachmentsFromConversation(
        currentId: string,
        targetId: string,
        page = 1,
        limit = 10
    ): Promise<PaginationResponseInterface<MessageAttachment>> {
        const [attachments, total] = await this.messageAttachmentRepository.findAndCount({
            where: [
                {sender: {id: currentId}, receiver: {id: targetId}},
                {sender: {id: targetId}, receiver: {id: currentId}},
            ],
            skip: (page - 1) * limit,
            take: limit,
            order: {
                sent_at: 'DESC',
            },
            relations: ['sender', 'receiver'],
        });

        if (total === 0 && page === 1) {
            return {
                data: [],
                metadata: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0,
                },
            };
        }

        return {
            data: attachments,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // Get all mixed messages and attachments from a conversation
    async getMixedConversationContent(
        currentId: string,
        targetId: string,
        page = 1,
        limit = 10
    ): Promise<PaginationResponseInterface<any>> {
        // Get messages
        const messages = await this.messageRepository.find({
            where: [
                {sender: {id: currentId}, receiver: {id: targetId}},
                {sender: {id: targetId}, receiver: {id: currentId}},
            ],
            relations: ['sender', 'receiver'],
        });

        // Get attachments
        const attachments = await this.messageAttachmentRepository.find({
            where: [
                {sender: {id: currentId}, receiver: {id: targetId}},
                {sender: {id: targetId}, receiver: {id: currentId}},
            ],
            relations: ['sender', 'receiver'],
        });

        // Combine and transform them into a uniform format
        const combinedItems = [
            ...messages.map((msg) => ({
                ...msg,
                type: 'message',
                timestamp: msg.sent_at,
            })),
            ...attachments.map((att) => ({
                ...att,
                type: 'attachment',
                timestamp: att.sent_at,
            })),
        ];

        // Sort by timestamp in descending order
        // Sort by timestamp in descending order
        combinedItems.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
        // Perform pagination
        const total = combinedItems.length;
        const startIndex = (page - 1) * limit;
        const endIndex = Math.min(startIndex + limit, total);
        const paginatedItems = combinedItems.slice(startIndex, endIndex);

        return {
            data: paginatedItems,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

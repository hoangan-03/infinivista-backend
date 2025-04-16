import {Controller} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';

import {Message} from '@/entities/internal/message.entity';
import {MessageAttachment} from '@/entities/internal/message-attachment.entity';
import {PaginationResponseInterface} from '@/interfaces/pagination-response.interface';
import {UpdateMessageDto} from '@/modules/messaging/dto/update-message.dto';

import {AttachmentMessageDto} from './dto/attachment-message.dto';
import {CreateMessageDto} from './dto/create-message.dto';
import {EmoteReactionDto} from './dto/emote-reaction.dto';
import {MessagingService} from './messaging.service';

@Controller()
export class MessagingController {
    constructor(private readonly messageService: MessagingService) {}

    /**
     * Get all messages
     */
    @MessagePattern('GetAllMessageCommand')
    async getAllMessages(payload: {page?: number; limit?: number}): Promise<PaginationResponseInterface<Message>> {
        return await this.messageService.getMessages(payload.page, payload.limit);
    }

    /**
     * Get all message from a conversation of a friend
     */
    @MessagePattern('GetAllMessageFromConversationCommand')
    async getAllMessageFromConversation(payload: {
        currentId: string;
        targetId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<Message>> {
        return await this.messageService.getMessagesFromConversation(
            payload.currentId,
            payload.targetId,
            payload.page,
            payload.limit
        );
    }

    /**
     * Create a new message
     */
    @MessagePattern('CreateMessageCommand')
    async createMessage(payload: {senderId: string; createMessageDto: CreateMessageDto}): Promise<Message> {
        return await this.messageService.createTextMessage(payload.senderId, payload.createMessageDto);
    }

    /**
     * Get a specific message
     */
    @MessagePattern('GetIdMessageCommand')
    async getMessage(payload: {id: string}) {
        return await this.messageService.getMessageById(payload.id);
    }

    /**
     * Update message text
     */
    @MessagePattern('UpdateMessageCommand')
    async updateMessage(payload: {id: string; updateMessageDto: UpdateMessageDto}) {
        return await this.messageService.updateMessage(payload.id, payload.updateMessageDto);
    }
    @MessagePattern('MarkMessageAsSeenCommand')
    async markMessageAsSeen(payload: {id: string; currentId: string}): Promise<Message> {
        {
            return await this.messageService.markMessageAsSeen(payload.id, payload.currentId);
        }
    }

    /**
     * Add reaction/emotion to a message
     */
    @MessagePattern('AddReactionCommand')
    async addReaction(payload: {id: string; emoteReactionDto: EmoteReactionDto; currentId: string}): Promise<Message> {
        return await this.messageService.dropEmoteInAConversation(
            payload.id,
            payload.emoteReactionDto,
            payload.currentId
        );
    }

    /**
     * Change reaction emote on a message
     */
    @MessagePattern('ChangeReactionCommand')
    async changeReaction(payload: {
        id: string;
        emoteReactionDto: EmoteReactionDto;
        currentId: string;
    }): Promise<Message> {
        return await this.messageService.changeEmote(payload.id, payload.emoteReactionDto, payload.currentId);
    }

    /**
     * Remove reaction from a message
     */
    @MessagePattern('RemoveReactionCommand')
    async removeReaction(payload: {id: string; currentId: string}): Promise<Message> {
        return await this.messageService.removeEmote(payload.id, payload.currentId);
    }

    /**
     * Create a message attachment
     */
    @MessagePattern('CreateAttachmentMessageCommand')
    async createAttachmentMessage(payload: {
        senderId: string;
        attachmentMessageDto: AttachmentMessageDto;
    }): Promise<MessageAttachment> {
        return await this.messageService.createAttachmentMessageFromDto(payload.senderId, payload.attachmentMessageDto);
    }

    /**
     * Delete a message attachment
     */
    @MessagePattern('DeleteAttachmentCommand')
    async deleteAttachment(payload: {id: string; currentId: string}): Promise<{success: boolean}> {
        return await this.messageService.deleteAttachment(payload.id, payload.currentId);
    }

    /**
     * Mark an attachment as seen
     */
    @MessagePattern('MarkAttachmentAsSeenCommand')
    async markAttachmentAsSeen(payload: {id: string; currentId: string}): Promise<MessageAttachment> {
        return await this.messageService.markAttachmentAsSeen(payload.id, payload.currentId);
    }

    /**
     * Add reaction to an attachment
     */
    @MessagePattern('AddReactionToAttachmentCommand')
    async addReactionToAttachment(payload: {
        id: string;
        emoteReactionDto: EmoteReactionDto;
        currentId: string;
    }): Promise<MessageAttachment> {
        return await this.messageService.addReactionToAttachment(
            payload.id,
            payload.emoteReactionDto,
            payload.currentId
        );
    }

    /**
     * Remove reaction from an attachment
     */
    @MessagePattern('RemoveReactionFromAttachmentCommand')
    async removeReactionFromAttachment(payload: {id: string; currentId: string}): Promise<MessageAttachment> {
        return await this.messageService.removeReactionFromAttachment(payload.id, payload.currentId);
    }

    /**
     * Get all attachments from a conversation
     */
    @MessagePattern('GetAllAttachmentsFromConversationCommand')
    async getAllAttachmentsFromConversation(payload: {
        currentId: string;
        targetId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<MessageAttachment>> {
        return await this.messageService.getAttachmentsFromConversation(
            payload.currentId,
            payload.targetId,
            payload.page,
            payload.limit
        );
    }

    /**
     * Get all mixed messages and attachments from a conversation
     */
    @MessagePattern('GetMixedConversationContentCommand')
    async getMixedConversationContent(payload: {
        currentId: string;
        targetId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<any>> {
        return await this.messageService.getMixedConversationContent(
            payload.currentId,
            payload.targetId,
            payload.page,
            payload.limit
        );
    }

    /**
     * Hide a message
     */
    @MessagePattern('HideMessageCommand')
    async hideMessage(payload: {id: string}): Promise<{success: boolean}> {
        return await this.messageService.hiddenMessage(payload.id);
    }

    /**
     * Delete a message
     */
    @MessagePattern('DeleteMessageCommand')
    async deleteMessage(payload: {id: string; currentId: string}): Promise<{success: boolean}> {
        return await this.messageService.deleteMessage(payload.id, payload.currentId);
    }
}

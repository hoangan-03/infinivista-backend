import {NotFoundException} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';

import {Message} from '@/entities/message.entity';
import {MessageText} from '@/entities/message-text.entity';
import {CreateMessageDto} from '@/modules/messaging/dto/create-message.dto';
import {UpdateMessageDto} from '@/modules/messaging/dto/update-message.dto';

import {EmoteReactionDto} from './dto/emote-reaction.dto';
import {MessageStatus} from './enums/message-status.enum';
import {MessageType} from './enums/message-type.enum';
import {MessagingService} from './messaging.service';

export class MessagingController {
    constructor(private readonly messageService: MessagingService) {}

    /**
     * Render chat interface
     */
    // @MessagePattern()
    // @Render('index')
    // Home() {
    //     return;
    // }

    /**
     * Get all messages
     */
    @MessagePattern('GetAllMessageCommand')
    async getAllMessages() {
        return await this.messageService.getMessages();
    }

    /**
     * Create a new message
     */
    @MessagePattern('CreateMessageCommand')
    async createMessage(payload: {createMessageDto: CreateMessageDto}) {
        // Create a new message entity
        const message = new Message();
        message.type = payload.createMessageDto.type;
        message.status = payload.createMessageDto.status || MessageStatus.SENT;
        message.sent_at = new Date();

        // Save the message first
        const savedMessage = await this.messageService.createMessage(message);

        // If it's a text message, create the text content
        if (payload.createMessageDto.type === MessageType.TEXT && payload.createMessageDto.text) {
            // Create text content
            const textMessage = new MessageText();
            textMessage.text = payload.createMessageDto.text;
            textMessage.message = savedMessage;

            // This will handle saving the text and updating the message relation
            await this.messageService.updateMessage(savedMessage.id.toString(), payload.createMessageDto.text);
        }

        // Return the created message
        return savedMessage;
    }

    /**
     * Get a specific message
     */
    @MessagePattern('GetIdMessageCommand')
    async getMessage(payload: {id: string}) {
        const message = await this.messageService.getMessageById(payload.id);
        if (!message) {
            throw new NotFoundException(`Message with ID ${payload.id} not found`);
        }
        return message;
    }

    /**
     * Update message text
     */
    @MessagePattern('UpdateMessageCommand')
    async updateMessage(payload: {id: string; updateMessageDto: UpdateMessageDto}) {
        return await this.messageService.updateMessage(payload.id, payload.updateMessageDto.text);
    }

    /**
     * Add reaction/emotion to a message
     */
    @MessagePattern('AddReactionCommand')
    async addReaction(payload: {id: string; emoteReactionDto: EmoteReactionDto}) {
        return await this.messageService.dropEmote(payload.emoteReactionDto.emotion, payload.id);
    }

    /**
     * Hide a message
     */
    @MessagePattern('HideMessageCommand')
    async hideMessage(payload: {id: string}) {
        return await this.messageService.hiddenMessage(payload.id);
    }

    /**
     * Delete a message
     */
    @MessagePattern('DeleteMessageCommand')
    async deleteMessage(payload: {id: string}) {
        return await this.messageService.deleteMessage(payload.id);
    }
}

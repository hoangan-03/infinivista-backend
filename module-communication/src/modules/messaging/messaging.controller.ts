import {Controller} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';

import {UpdateMessageDto} from '@/modules/messaging/dto/update-message.dto';

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
    async getAllMessages() {
        return await this.messageService.getMessages();
    }

    /**
     * Create a new message
     */
    @MessagePattern('CreateMessageCommand')
    async createMessage(payload: {senderId: string; createMessageDto: CreateMessageDto}) {
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

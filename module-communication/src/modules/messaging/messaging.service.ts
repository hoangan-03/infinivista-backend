import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {Message} from '@/entities/message.entity';
import {MessageText} from '@/entities/message-text.entity';

import {EmoteIcon} from './enums/emote-icon.enum';
import {MessageStatus} from './enums/message-status.enum';
import {MessageType} from './enums/message-type.enum';

@Injectable()
export class MessagingService {
    constructor(
        @InjectRepository(Message) private messageRepository: Repository<Message>,
        @InjectRepository(Message)
        private messageTextRepository: Repository<MessageText>
    ) {}
    async createMessage(message: Message): Promise<Message> {
        return await this.messageRepository.save(message);
    }

    async getMessages(): Promise<Message[]> {
        return await this.messageRepository.find();
    }

    async getMessageById(messageId: string): Promise<Message> {
        const message = await this.messageRepository.findOne({
            where: {id: parseInt(messageId)},
        });

        if (!message) {
            throw new NotFoundException(`Message with ID ${messageId} not found`);
        }

        return message;
    }

    async dropEmote(emotion: EmoteIcon, messageId: string): Promise<void> {
        const message = await this.messageRepository.findOne({
            where: {id: parseInt(messageId)},
        });
        if (message) {
            message.emotion = emotion;
            await this.messageRepository.save(message);
        }
    }

    async hiddenMessage(messageId: string): Promise<void> {
        const message = await this.messageRepository.findOne({
            where: {id: parseInt(messageId)},
        });
        if (message) {
            message.status = MessageStatus.HIDDEN;
            await this.messageRepository.save(message);
        } else {
            throw new NotFoundException(`Message with ID ${messageId} not found`);
        }
    }

    async deleteMessage(messageId: string): Promise<void> {
        const message = await this.messageRepository.findOne({
            where: {id: parseInt(messageId)},
        });
        if (message) {
            message.status = MessageStatus.HIDDEN;
            await this.messageRepository.save(message);
        } else {
            throw new NotFoundException(`Message with ID ${messageId} not found`);
        }
    }

    async updateMessage(messageId: string, text: string): Promise<void> {
        // Find message with its text relation
        const message = await this.messageRepository.findOne({
            where: {id: parseInt(messageId)},
            relations: ['textMessage'],
        });

        if (!message) {
            throw new NotFoundException(`Message with ID ${messageId} not found`);
        }

        if (message.type !== MessageType.TEXT) {
            throw new BadRequestException(`Cannot update text for non-text message type: ${message.type}`);
        }

        if (message.textMessage) {
            message.textMessage.text = text;
            await this.messageTextRepository.save(message.textMessage);
        } else {
            const newTextMessage = this.messageTextRepository.create({
                text: text,
                message: message,
            });

            const savedTextMessage = await this.messageTextRepository.save(newTextMessage);

            message.textMessage = savedTextMessage;
            await this.messageRepository.save(message);
        }

        message.last_modified_at = new Date();
        await this.messageRepository.save(message);
    }
}

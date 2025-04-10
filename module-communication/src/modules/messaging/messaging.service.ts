import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {Message} from '@/entities/internal/message.entity';
import {MessageText} from '@/entities/internal/message-text.entity';

import {CreateMessageDto} from './dto/create-message.dto';
import {EmoteIcon} from './enums/emote-icon.enum';
import {MessageStatus} from './enums/message-status.enum';
import {MessageType} from './enums/message-type.enum';

@Injectable()
export class MessagingService {
    constructor(
        @InjectRepository(Message) private messageRepository: Repository<Message>,
        @InjectRepository(MessageText) private messageTextRepository: Repository<MessageText>
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
        }

        message.last_modified_at = new Date();
        return await this.messageRepository.save(message);
    }

    async createMessageWithContent(createMessageDto: CreateMessageDto): Promise<Message> {
        // Create a new message entity
        const message = new Message();
        message.type = createMessageDto.type;
        message.status = createMessageDto.status || MessageStatus.SENT;
        message.sent_at = new Date();

        // Save the message first
        const savedMessage = await this.createMessage(message);

        // If it's a text message, create the text content
        if (createMessageDto.type === MessageType.TEXT && createMessageDto.text) {
            // This will handle saving the text and updating the message relation
            await this.updateMessage(savedMessage.id.toString(), createMessageDto.text);
        }

        // Return the created message with relations
        return this.getMessageById(savedMessage.id.toString());
    }
}

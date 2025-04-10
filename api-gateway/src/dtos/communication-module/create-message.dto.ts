import {ApiProperty} from '@nestjs/swagger';
import {IsEnum, IsNotEmpty, IsOptional, IsString} from 'class-validator';

import {MessageType} from '@/enums/communication-module/message-type.enum';

export class CreateMessageDto {
    @ApiProperty({
        description: 'Content of the message',
        example: 'Hello world!',
    })
    @IsNotEmpty()
    @IsString()
    content: string;

    @ApiProperty({
        description: 'User ID of the sender',
        example: '1',
    })
    @IsNotEmpty()
    @IsString()
    senderId: string;

    @ApiProperty({
        description: 'Type of message',
        enum: MessageType,
        default: MessageType.TEXT,
    })
    @IsEnum(MessageType)
    @IsOptional()
    type?: MessageType = MessageType.TEXT;
}

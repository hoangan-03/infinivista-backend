// import {ApiProperty} from '@nestjs/swagger';
import {IsEnum, IsOptional, IsString} from 'class-validator';

import {MessageStatus} from '../enums/message-status.enum';
import {MessageType} from '../enums/message-type.enum';

export class CreateMessageDto {
    // @ApiProperty({
    //     description: 'Message type',
    //     enum: MessageType,
    //     example: MessageType.TEXT,
    // })
    @IsEnum(MessageType)
    type: MessageType;

    // @ApiProperty({
    //     description: 'Message content for text messages',
    //     example: 'Hello world!',
    //     required: false,
    // })
    @IsString()
    @IsOptional()
    text?: string;

    // @ApiProperty({
    //     description: 'Initial message status',
    //     enum: MessageStatus,
    //     example: MessageStatus.SENT,
    //     required: false,
    //     default: MessageStatus.SENT,
    // })
    @IsEnum(MessageStatus)
    @IsOptional()
    status?: MessageStatus;
}

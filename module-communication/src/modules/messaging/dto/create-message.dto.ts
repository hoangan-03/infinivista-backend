import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MessageType } from '../enums/message-type.enum';
import { MessageStatus } from '../enums/message-status.enum';

export class CreateMessageDto {
  @ApiProperty({ 
    description: 'Message type',
    enum: MessageType,
    example: MessageType.TEXT
  })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiProperty({ 
    description: 'Message content for text messages',
    example: 'Hello world!',
    required: false
  })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({ 
    description: 'Initial message status',
    enum: MessageStatus,
    example: MessageStatus.SENT,
    required: false,
    default: MessageStatus.SENT
  })
  @IsEnum(MessageStatus)
  @IsOptional()
  status?: MessageStatus;
}
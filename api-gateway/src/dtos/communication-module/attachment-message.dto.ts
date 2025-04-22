import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {IsNotEmpty, IsOptional, IsString, IsUUID} from 'class-validator';

import {AttachmentType} from '@/enums/communication-module/attachment-type.enum';

export class AttachmentMessageDto {
    @ApiProperty({
        description: 'The ID of the recipient user',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsNotEmpty()
    @IsString()
    @IsUUID()
    recipientId: string;

    @ApiProperty({
        description: 'The URL of the attachment',
        example: 'https://example.com/file.jpg',
    })
    @IsNotEmpty()
    @IsString()
    attachmentUrl: string;

    @ApiPropertyOptional({
        description: 'The name of the attachment',
        example: 'vacation-photo.jpg',
    })
    @IsOptional()
    @IsString()
    attachmentName?: string;

    @ApiProperty({
        description: 'Attachment Type',
        example: AttachmentType.IMAGE,
        enum: AttachmentType,
    })
    attachmentType: AttachmentType;
}

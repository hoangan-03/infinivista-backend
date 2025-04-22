import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsOptional, IsString} from 'class-validator';

import {AttachmentType} from '@/enums/communication-module/attachment-type.enum';

export class CreateMessageAttachmentDto {
    @ApiProperty({
        description: 'Attachment URL',
        example: 'https://example.com/image.jpg',
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    attachment_url: string;

    @ApiProperty({
        description: 'Attachment Name',
        example: 'image.jpg',
        type: String,
    })
    @IsOptional()
    @IsString()
    attachment_name?: string;

    @ApiProperty({
        description: 'Attachment Type',
        example: AttachmentType.IMAGE,
        enum: AttachmentType,
    })
    attachmentType: AttachmentType;
}

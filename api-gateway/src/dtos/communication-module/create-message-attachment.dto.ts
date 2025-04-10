import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsOptional, IsString} from 'class-validator';

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
}

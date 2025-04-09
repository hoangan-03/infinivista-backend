import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsOptional, IsString} from 'class-validator';

import {PostAttachmentDto} from './create-post.dto';

export class CommentPostDto {
    @ApiProperty({
        description: 'Post content text',
        example: 'This is my first post on InfiniVista!',
    })
    @IsString()
    @IsNotEmpty()
    text: string;

    @ApiProperty({
        description: 'Post attachments (images, videos, etc.)',
        type: [PostAttachmentDto],
        required: false,
    })
    @ApiProperty({
        required: false,
        description: 'Attachment url',
        example: 'https://example.com/image.jpg',
    })
    @IsString()
    @IsOptional()
    attachment_url?: string;
}

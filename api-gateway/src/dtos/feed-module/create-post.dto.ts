import {ApiProperty} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested} from 'class-validator';

export class PostAttachmentDto {
    @ApiProperty({
        required: false,
        description: 'Attachment url',
        example: 'https://example.com/image.jpg',
    })
    @IsString()
    @IsOptional()
    attachment_url?: string;
}

export class CreatePostDto {
    @ApiProperty({
        description: 'Post content text',
        example: 'This is my first post on InfiniVista!',
    })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({
        description: 'Post attachments (images, videos, etc.)',
        type: [PostAttachmentDto],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({each: true})
    @Type(() => PostAttachmentDto)
    postAttachments?: PostAttachmentDto[];
}

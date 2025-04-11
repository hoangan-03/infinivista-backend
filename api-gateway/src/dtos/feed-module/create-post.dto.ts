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
        example:
            'This is my first post on InfiniVista, and I’m thrilled to share an experience that blends so many passions of mine! Recently, I embarked on an incredible trip to a breathtaking destination, where I used my brand-new high-tech camera to capture stunning landscapes and vibrant city scenes. The technology behind this camera is mind-blowing—its advanced sensors and AI-assisted features made every shot a masterpiece. After returning home, I spent hours experimenting with photo editing software, applying creative techniques like color grading and digital overlays to transform my travel photos into unique pieces of art. I’ve always believed that modern tools can elevate both the way we explore the world and how we express our creativity, and this journey proved it. Can’t wait to hear your thoughts on how tech, travel, and art intersect in your lives!',
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

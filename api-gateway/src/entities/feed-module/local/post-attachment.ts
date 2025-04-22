import {ApiProperty} from '@nestjs/swagger';

import {AttachmentType} from '@/enums/feed-module/attachment-type.enum';

import {Post} from './post.entity';

export class PostAttachment {
    @ApiProperty({
        description: 'Unique identifier for the post attachment',
        example: '550e8400-e29b-41d4-a716-446655440000',
        type: String,
    })
    id: string;

    @ApiProperty({
        description: 'URL to the attachment (image, video, document)',
        example: 'https://storage.infinivista.com/attachments/image123.jpg',
        type: String,
    })
    attachment_url: string;

    @ApiProperty({
        description: 'Type of the attachment (image, video, document)',
        enum: AttachmentType,
        example: AttachmentType.IMAGE,
    })
    attachmentType: AttachmentType;

    @ApiProperty({
        description: 'The post this attachment belongs to',
        type: () => Post,
    })
    post: Post;
}

import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString} from 'class-validator';

import {AttachmentType} from '@/enums/feed-module/attachment-type.enum';

export class CreateStoryDto {
    @ApiProperty({
        description: 'Story Url Link',
        example: 'https/example.com/story.mp4',
    })
    @IsString()
    @IsNotEmpty()
    story_url: string;

    @ApiProperty({
        description: 'Duration in seconds that the story should be displayed',
        example: 15,
    })
    @IsNotEmpty()
    duration: number;

    @ApiProperty({
        description: 'Story thumbnail url',
        example: 'https://storage.infinivista.com/stories/thumbnail123.jpg',
    })
    @IsString()
    @IsNotEmpty()
    thumbnail_url: string;

    @ApiProperty({
        description: 'Story type',
        example: AttachmentType.VIDEO,
        enum: AttachmentType,
    })
    attachmentType: AttachmentType;
}

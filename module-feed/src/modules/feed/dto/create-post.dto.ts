import {Type} from 'class-transformer';

export class PostAttachmentDto {
    attachment_url?: string;
}

export class CreatePostDto {
    content: string;
    @Type(() => PostAttachmentDto)
    postAttachments?: PostAttachmentDto[];
}

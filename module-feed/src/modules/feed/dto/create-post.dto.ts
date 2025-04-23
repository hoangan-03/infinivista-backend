import {Type} from 'class-transformer';

import {AttachmentType} from '@/modules/feed/enum/attachment-type.enum';

export class PostAttachmentDto {
    attachment_url?: string;
    attachmentType: AttachmentType;
}

export class CreatePostDto {
    content: string;
    @Type(() => PostAttachmentDto)
    postAttachments?: PostAttachmentDto[];
}

import {AttachmentType} from '../enum/attachment-type.enum';

export class CreateStoryDto {
    story_url: string;

    thumbnail_url: string;

    duration: number;

    attachmentType: AttachmentType;
}

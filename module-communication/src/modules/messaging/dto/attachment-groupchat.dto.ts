import {IsNotEmpty, IsOptional, IsString} from 'class-validator';

import {AttachmentType} from '../enums/attachment-type.enum';

export class AttachmentGroupChatDto {
    @IsNotEmpty()
    @IsString()
    groupChatId: string;

    @IsNotEmpty()
    @IsString()
    attachmentUrl: string;

    @IsOptional()
    @IsString()
    attachmentName?: string;

    @IsNotEmpty()
    attachmentType: AttachmentType;
}

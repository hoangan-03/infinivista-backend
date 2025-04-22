import {IsNotEmpty, IsOptional, IsString} from 'class-validator';

import {AttachmentType} from '../enums/attachment-type.enum';

export class CreateMessageAttachmentDto {
    @IsNotEmpty()
    @IsString()
    attachment_url: string;

    @IsOptional()
    @IsString()
    attachment_name?: string;

    @IsNotEmpty()
    attachemnetType: AttachmentType;
}

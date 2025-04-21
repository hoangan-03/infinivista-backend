import {IsNotEmpty, IsOptional, IsString} from 'class-validator';

export class AttachmentGroupChatDto {
    @IsNotEmpty()
    @IsString()
    attachmentUrl: string;

    @IsOptional()
    @IsString()
    attachmentName?: string;
}

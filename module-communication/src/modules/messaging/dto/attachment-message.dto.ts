import {IsNotEmpty, IsOptional, IsString} from 'class-validator';

export class AttachmentMessageDto {
    @IsNotEmpty()
    @IsString()
    recipientId: string;

    @IsNotEmpty()
    @IsString()
    attachmentUrl: string;

    @IsOptional()
    @IsString()
    attachmentName?: string;
}

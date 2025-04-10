import {IsNotEmpty, IsOptional, IsString} from 'class-validator';

export class CreateMessageAttachmentDto {
    @IsNotEmpty()
    @IsString()
    attachment_url: string;

    @IsOptional()
    @IsString()
    attachment_name?: string;
}

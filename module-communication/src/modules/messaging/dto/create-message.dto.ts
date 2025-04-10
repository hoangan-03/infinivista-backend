import {IsNotEmpty, IsString} from 'class-validator';

export class CreateMessageDto {
    @IsNotEmpty()
    @IsString()
    messageText: string;

    @IsString()
    recipientId: string;
}

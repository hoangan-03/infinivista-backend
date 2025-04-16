import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString} from 'class-validator';

export class CreateMessageDto {
    @ApiProperty({
        description: 'Message Text',
        example: 'This is a message from president',
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    messageText: string;

    @ApiProperty({
        // recipientId
        description: 'ID of the recipient',
        example: 'c88d5a3d-2f71-499c-b5be-bab40e6b75ad',
        type: String,
    })
    @IsString()
    recipientId: string;
}

import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString} from 'class-validator';

export class CreateGroupMessageDto {
    @ApiProperty({
        description: 'Message Text',
        example: 'This is a message to group chat',
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    messageText: string;

    @ApiProperty({
        description: 'ID of the groupchat',
        example: 'f4cfd19e-fec2-4e6a-a14d-c97318ce9e7f',
        type: String,
    })
    @IsString()
    groupChatId: string;
}

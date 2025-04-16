import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString} from 'class-validator';

export class UpdateMessageDto {
    @ApiProperty({
        description: 'Updated content of the message',
        example: 'Updated message text',
    })
    @IsNotEmpty()
    @IsString()
    messageText: string;
}

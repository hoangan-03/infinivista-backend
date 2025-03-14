import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString} from 'class-validator';

export class UpdateMessageDto {
    @ApiProperty({
        description: 'New text content for the message',
        example: 'Updated message content',
    })
    @IsString()
    @IsNotEmpty()
    text: string;
}

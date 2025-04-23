import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString} from 'class-validator';

export class AddUserGroupChatDto {
    @ApiProperty({
        description: 'User ID that will be added to the group chat',
        example: 'f4cfd19e-fec2-4e6a-a14d-c97318ce9e7f',
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    userId: string;
}

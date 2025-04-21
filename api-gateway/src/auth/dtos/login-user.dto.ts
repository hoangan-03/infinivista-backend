import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, IsNotEmpty, IsString} from 'class-validator';
export class LoginUserDTO {
    @ApiProperty({
        example: 'admin@example.com',
        description: 'Email address',
    })
    @IsEmail()
    identifier: string;

    @ApiProperty({
        example: 'password123',
        description: 'Password',
    })
    @IsNotEmpty()
    @IsString()
    password: string;
}

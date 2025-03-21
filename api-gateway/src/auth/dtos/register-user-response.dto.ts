import {ApiProperty} from '@nestjs/swagger';
import {IsDefined, IsEmail, IsNotEmpty, MinLength} from 'class-validator';

export class RegisterUserResponseDto {
    @ApiProperty({
        example: 'testuser',
        description: 'Username for registration',
    })
    @IsDefined()
    @IsNotEmpty()
    @MinLength(8)
    readonly username: string;

    @ApiProperty({
        example: 'test@example.com',
        description: 'Email address',
    })
    @IsDefined()
    @IsEmail()
    readonly email: string;

    constructor(email: string, username: string) {
        this.email = email;
        this.username = username;
    }
}

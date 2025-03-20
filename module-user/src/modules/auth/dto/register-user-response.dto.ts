import {IsDefined, IsEmail, IsNotEmpty, MinLength} from 'class-validator';

export class RegisterUserResponseDto {
    @IsDefined()
    @IsNotEmpty()
    @MinLength(8)
    readonly username: string;

    @IsDefined()
    @IsEmail()
    readonly email: string;

    constructor(email: string, username: string) {
        this.email = email;
        this.username = username;
    }
}

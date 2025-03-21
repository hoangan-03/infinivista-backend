import {IsDefined, IsEmail, IsNotEmpty, Matches, MinLength, Validate} from 'class-validator';

export class RegisterUserDto {
    @IsDefined()
    @IsNotEmpty()
    readonly username: string;

    @IsDefined()
    @IsEmail()
    @IsNotEmpty()
    readonly email: string;

    @IsDefined()
    @IsNotEmpty()
    @MinLength(8)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/, {
        message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 special character',
    })
    readonly password: string;
}

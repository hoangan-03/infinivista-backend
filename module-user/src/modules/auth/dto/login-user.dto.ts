import {IsEmail, IsNotEmpty, IsString} from 'class-validator';
export class LoginUserDTO {
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}

import {IsDefined, IsEmail, IsNotEmpty, MinLength, Validate} from 'class-validator';

import {IsUserAlreadyExist} from '@/modules/user/validators/is-user-already-exist.validator';
export class RegisterUserResponseDto {
    @IsDefined()
    @IsNotEmpty()
    @MinLength(8)
    readonly username: string;

    @IsDefined()
    @IsEmail()
    @Validate(IsUserAlreadyExist)
    readonly email: string;

    constructor(email: string, username: string) {
        this.email = email;
        this.username = username;
    }
}

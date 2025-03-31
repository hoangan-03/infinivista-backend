import {IsDefined, IsEmail, IsNotEmpty, Matches, MinLength, Validate} from 'class-validator';

import {IsUserAlreadyExist} from '../validators/is-user-already-exist.validator';
import {IsUserNameAlreadyExist} from '../validators/is-username-already-exist.validator';

export class RegisterUserDto {
    @IsDefined()
    @IsNotEmpty()
    @Validate(IsUserNameAlreadyExist)
    readonly username: string;

    @IsDefined()
    @IsEmail()
    @IsNotEmpty()
    @Validate(IsUserAlreadyExist)
    readonly email: string;

    @IsDefined()
    @IsNotEmpty()
    @MinLength(8)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/, {
        message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 special character',
    })
    readonly password: string;
}

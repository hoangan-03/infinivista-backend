import {IsDateString, IsEnum, IsOptional, IsString} from 'class-validator';

import {Gender} from '../enums/gender.enum';

export class UpdateUserDto {
    phoneNumber?: string;

    dob?: Date;

    gender?: Gender;

    biography?: string;

    firstName?: string;

    lastName?: string;
}

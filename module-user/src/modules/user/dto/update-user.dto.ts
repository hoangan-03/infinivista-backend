import {IsDateString, IsEnum, IsOptional, IsString} from 'class-validator';

import {Gender} from '../enums/gender.enum';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsDateString()
    dob?: Date;

    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;
}

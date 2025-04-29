import {IsEmail, IsEnum, IsOptional, IsString, IsUrl} from 'class-validator';

import {PageCategoryEnum} from '../enum/page-category.enum';

export class UpdatePageDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(PageCategoryEnum)
    @IsOptional()
    category?: PageCategoryEnum;

    @IsUrl()
    @IsOptional()
    website?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    country?: string;
}

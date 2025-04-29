import {IsEmail, IsEnum, IsOptional, IsString, IsUrl} from 'class-validator';

import {PageCategoryEnum} from '../enum/page-category.enum';

export class CreatePageDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(PageCategoryEnum)
    category: PageCategoryEnum;

    @IsUrl()
    @IsOptional()
    website?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phoneNumber?: string;
}

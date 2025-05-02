import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, IsEnum, IsOptional, IsString, IsUrl} from 'class-validator';

import {PageCategoryEnum} from '@/enums/feed-module/page-category.enum';

export class CreatePageDto {
    @ApiProperty({
        description: 'Name of the page',
        example: 'Tech Enthusiasts',
        required: true,
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Description of the page',
        example: 'A community for technology lovers',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Category of the page',
        enum: PageCategoryEnum,
        example: 'TECHNOLOGY',
        required: true,
    })
    @IsEnum(PageCategoryEnum)
    category: PageCategoryEnum;

    @ApiProperty({
        description: 'Website URL associated with the page',
        example: 'https://techpage.com',
        required: false,
    })
    @IsUrl()
    @IsOptional()
    website?: string;

    @ApiProperty({
        description: 'Contact email for the page',
        example: 'contact@techpage.com',
        required: false,
    })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({
        description: 'Contact phone number for the page',
        example: '+1-555-123-4567',
        required: false,
    })
    @IsString()
    @IsOptional()
    phoneNumber?: string;
}

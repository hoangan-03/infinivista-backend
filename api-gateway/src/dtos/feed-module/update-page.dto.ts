import {ApiProperty} from '@nestjs/swagger';
import {IsEmail, IsEnum, IsOptional, IsString, IsUrl} from 'class-validator';

import {PageCategoryEnum} from '@/enums/feed-module/page-category.enum';

export class UpdatePageDto {
    @ApiProperty({
        description: 'Name of the page',
        example: 'Tech Enthusiasts',
        required: false,
    })
    @IsString()
    @IsOptional()
    name?: string;

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
        required: false,
    })
    @IsEnum(PageCategoryEnum)
    @IsOptional()
    category?: PageCategoryEnum;

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

    @ApiProperty({
        description: "Physical address of the page's represented entity",
        example: '123 Tech Boulevard, Suite 400',
        required: false,
    })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty({
        description: "City where the page's entity is located",
        example: 'San Francisco',
        required: false,
    })
    @IsString()
    @IsOptional()
    city?: string;

    @ApiProperty({
        description: "Country where the page's entity is located",
        example: 'United States',
        required: false,
    })
    @IsString()
    @IsOptional()
    country?: string;
}

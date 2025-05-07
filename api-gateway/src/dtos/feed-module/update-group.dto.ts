import {ApiProperty} from '@nestjs/swagger';
import {IsEnum, IsOptional, IsString} from 'class-validator';

import {groupVisibility} from '@/enums/feed-module/group-visibility.enum';

export class UpdateGroupDto {
    @ApiProperty({
        description: 'Group name',
        example: 'Photography Enthusiasts',
        required: false,
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        description: 'Group description',
        example: 'A group for people who love photography and want to share their experiences.',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Group visibility',
        enum: groupVisibility,
        required: false,
    })
    @IsEnum(groupVisibility)
    @IsOptional()
    visibility?: groupVisibility;

    @ApiProperty({
        description: 'City',
        example: 'New York',
        required: false,
    })
    @IsString()
    @IsOptional()
    city?: string;

    @ApiProperty({
        description: 'Country',
        example: 'United States',
        required: false,
    })
    @IsString()
    @IsOptional()
    country?: string;
}

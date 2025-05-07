import {IsEnum, IsNotEmpty, IsOptional, IsString} from 'class-validator';

import {groupVisibility} from '../enum/group-visibility.enum';

export class CreateGroupDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(groupVisibility)
    @IsOptional()
    visibility?: groupVisibility;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    country?: string;

    @IsString()
    @IsOptional()
    profileImageUrl?: string;

    @IsString()
    @IsOptional()
    coverImageUrl?: string;
}

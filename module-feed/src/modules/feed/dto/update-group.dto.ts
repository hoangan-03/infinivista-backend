import {IsEnum, IsOptional, IsString} from 'class-validator';

import {groupVisibility} from '../enum/group-visibility.enum';

export class UpdateGroupDto {
    @IsString()
    @IsOptional()
    name?: string;

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

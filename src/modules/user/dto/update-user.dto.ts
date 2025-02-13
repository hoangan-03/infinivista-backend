import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Gender } from '../enums/gender.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'User phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    example: '1990-01-01',
    description: 'User date of birth',
    required: false
  })
  @IsOptional()
  @IsDateString()
  dob?: Date;

  @ApiProperty({
    enum: Gender,
    enumName: 'Gender',
    example: Gender.MALE,
    description: 'User gender',
    required: false
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
    required: false
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
    required: false
  })
  @IsOptional()
  @IsString()
  lastName?: string;
}
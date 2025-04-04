import {ApiProperty} from '@nestjs/swagger';
import {Exclude} from 'class-transformer';
import {IsEnum, IsOptional} from 'class-validator';

import {NewsFeed} from '@/entities/feed-module/local/newsfeed.entity';
import {Gender} from '@/enums/user-module/gender.enum';
import {ProfilePrivacy} from '@/enums/user-module/profile-privacy.enum';

import {BaseEntity} from '../../base/base-class';
import {Friend} from './friend.entity';
import {FriendRequest} from './friend-request.entity';
import {SecurityAnswer} from './security-answer.entity';
import {Setting} from './setting.entity';
import {UserStatus} from './user-status.entity';

export class User extends BaseEntity {
    @ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'User unique identifier',
    })
    id: string;

    @ApiProperty({
        example: 'user@example.com',
        description: 'User email address',
    })
    email: string;

    @ApiProperty({
        example: 'johndoe',
        description: 'User username',
    })
    username: string;

    @Exclude()
    password?: string;

    @ApiProperty({
        example: '+1234567890',
        description: 'User phone number',
        required: false,
    })
    phoneNumber: string;

    @ApiProperty({
        example: '1990-01-01',
        description: 'User date of birth',
        required: false,
    })
    dob: Date;

    @ApiProperty({
        enum: Gender,
        enumName: 'Gender',
        example: Gender.MALE,
        description: 'User gender',
        required: false,
    })
    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @ApiProperty({
        example: 'John',
        description: 'User first name',
        required: false,
    })
    firstName: string;

    @ApiProperty({
        example: 'Doe',
        description: 'User last name',
        required: false,
    })
    lastName: string;

    @ApiProperty({
        example: 'https://example.com/profile.jpg',
        description: 'User profile image URL',
        required: false,
    })
    profileImageUrl: string;

    @ApiProperty({
        example: 'https://example.com/cover.jpg',
        description: 'User cover image URL',
        required: false,
    })
    coverImageUrl: string;

    @ApiProperty({
        type: () => UserStatus,
        description: 'User status',
    })
    status: UserStatus;

    @ApiProperty({
        type: () => [Setting],
        description: 'User settings',
    })
    settings: Setting[];

    @ApiProperty({
        example: 'https://example.com/profile.jpg',
        description: 'User profile image URL',
        required: false,
    })
    address: string;

    securityAnswers: SecurityAnswer[];

    @ApiProperty({
        example: ProfilePrivacy.PUBLIC,
        description: 'Profile privacy level',
    })
    profilePrivacy: ProfilePrivacy;

    friends: Friend[];

    sentFriendRequests: FriendRequest[];

    receivedFriendRequests: FriendRequest[];

    sharedNewsFeeds: NewsFeed[];

    newsfeed: NewsFeed;
}

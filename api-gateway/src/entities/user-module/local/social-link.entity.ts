import {ApiProperty} from '@nestjs/swagger';
import {Entity, ManyToOne} from 'typeorm';

import {BaseEntity} from '@/entities/base/base-class';
import {SocialLinkType} from '@/enums/user-module/social-link.enum';

import {User} from './user.entity';

@Entity({name: 'social_links'})
export class SocialLink extends BaseEntity {
    @ApiProperty({
        description: 'Unique identifier for the social link',
        example: '550e8400-e29b-41d4-a716-446655440000',
        readOnly: true,
    })
    id: string;

    @ApiProperty({
        description: 'Type of the social link',
        enum: SocialLinkType,
        enumName: 'SocialLinkType',
        example: SocialLinkType.FACEBOOK,
        required: true,
    })
    type: SocialLinkType;

    @ApiProperty({
        description: 'URL of the social link',
        example: 'https://www.facebook.com/user123',
        required: true,
    })
    link: string;

    @ManyToOne(() => User, (user) => user.socialLinks)
    user: User;

    user_id: string;
}

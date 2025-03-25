import {ApiProperty} from '@nestjs/swagger';

import {SettingType} from '@/enums/user-module/setting.enum';

import {BaseEntity} from '../../base/base-class';
import {User} from './user.entity';

export class Setting extends BaseEntity {
    @ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Setting unique identifier',
    })
    id: string;

    @ApiProperty({type: () => User})
    user: User;

    user_id: string;

    @ApiProperty({
        enum: SettingType,
        example: SettingType.NOTIFICATION,
        description: 'Setting type',
    })
    type: SettingType;

    @ApiProperty({
        example: 'true',
        description: 'Setting value',
    })
    value: string;
}

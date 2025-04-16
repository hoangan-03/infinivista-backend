import {ApiProperty} from '@nestjs/swagger';
import {IsEnum, IsNotEmpty} from 'class-validator';

import {EmoteIcon} from '@/enums/communication-module/emote-icon.enum';

export class EmoteReactionDto {
    @ApiProperty({
        description: 'Emotional reaction icon',
        enum: EmoteIcon,
        example: EmoteIcon.HEART,
    })
    @IsNotEmpty()
    @IsEnum(EmoteIcon)
    emotion: EmoteIcon;
}

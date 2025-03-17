// import {ApiProperty} from '@nestjs/swagger';
import {IsEnum, IsNotEmpty} from 'class-validator';

import {EmoteIcon} from '../enums/emote-icon.enum';

export class EmoteReactionDto {
    // @ApiProperty({
    //     description: 'Emote/reaction to add to the message',
    //     enum: EmoteIcon,
    //     example: EmoteIcon.THUMBS_UP,
    // })
    @IsEnum(EmoteIcon)
    @IsNotEmpty()
    emotion: EmoteIcon;
}

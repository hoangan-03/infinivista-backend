import {ApiProperty} from '@nestjs/swagger';
import {IsEnum, IsNotEmpty, IsString} from 'class-validator';

import {TranslationLanguage} from '@/enums/feed-module/translation-language.enum';

export class TranslateContentDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({description: 'The content to translate', example: 'Hello, world!'})
    content: string;

    @IsNotEmpty()
    @IsEnum(TranslationLanguage)
    @ApiProperty({
        description: 'The target language to translate to',
        example: TranslationLanguage.VIETNAMESE,
        enum: TranslationLanguage,
        enumName: 'TranslationLanguage',
    })
    targetLanguage: TranslationLanguage;
}

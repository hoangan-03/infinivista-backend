import {TranslationLanguage} from '@/modules/feed/enum/translation-language.enum';

export class TranslateContentDto {
    content: string;

    targetLanguage: TranslationLanguage;
}

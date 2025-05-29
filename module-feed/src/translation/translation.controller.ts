import {Controller} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';

import {TranslateContentDto} from './translation.dto';
import {TranslationService} from './translation.service';

@Controller('translation')
export class TranslationController {
    constructor(private readonly translationService: TranslationService) {}

    @MessagePattern('translation.translate')
    async translateContent(payload: TranslateContentDto): Promise<string> {
        return this.translationService.translate(payload);
    }
}

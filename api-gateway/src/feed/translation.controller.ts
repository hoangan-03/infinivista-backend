import {Body, Controller, Inject, Post, UseGuards} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {lastValueFrom} from 'rxjs';

import {TranslateContentDto} from '@/dtos/feed-module/translation.dto';
import {JWTAuthGuard} from '@/guards/jwt-auth.guard';

@ApiTags('Translation')
@Controller('translation')
@UseGuards(JWTAuthGuard)
@ApiBearerAuth()
export class TranslationController {
    constructor(@Inject('FEED_SERVICE') private readonly feedService: ClientProxy) {}

    @Post()
    @ApiBody({type: TranslateContentDto})
    @ApiOperation({summary: 'Translate content'})
    @ApiResponse({status: 200, description: 'Successfully translated content.', type: String})
    @ApiResponse({status: 400, description: 'Bad Request.'})
    @ApiResponse({status: 401, description: 'Unauthorized.'})
    @ApiResponse({status: 500, description: 'Internal Server Error.'})
    async translateContent(@Body() translateContentDto: TranslateContentDto): Promise<string> {
        return await lastValueFrom(this.feedService.send('translation.translate', translateContentDto));
    }
}

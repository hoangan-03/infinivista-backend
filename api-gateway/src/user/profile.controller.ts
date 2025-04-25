import {
    Body,
    Controller,
    Get,
    Inject,
    Param,
    Patch,
    Post,
    Put,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {FileInterceptor} from '@nestjs/platform-express';
import {ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {lastValueFrom} from 'rxjs';

import {UpdateUserDto} from '@/auth/dtos/update-user.dto';
import {CurrentUser} from '@/decorators/user.decorator';
import {FileUploadDto} from '@/dtos/common/file-upload.dto';
import {SecurityAnswer} from '@/entities/user-module/local/security-answer.entity';
import {Setting} from '@/entities/user-module/local/setting.entity';
import {User} from '@/entities/user-module/local/user.entity';
import {ProfilePrivacy} from '@/enums/user-module/profile-privacy.enum';
import {SettingType} from '@/enums/user-module/setting.enum';
import {JWTAuthGuard} from '@/guards/jwt-auth.guard';
import {JwtBlacklistGuard} from '@/guards/jwt-blacklist.guard';
import {FileUploadService} from '@/services/file-upload.service';

@ApiBearerAuth()
@UseGuards(JwtBlacklistGuard, JWTAuthGuard)
@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
    constructor(
        @Inject('USER_SERVICE') private userClient: ClientProxy,
        private fileUploadService: FileUploadService
    ) {}

    @Patch()
    @ApiOperation({summary: 'Update user profile information'})
    @ApiBody({type: UpdateUserDto})
    @ApiResponse({status: 200, description: 'Return user after updated', type: User})
    @ApiResponse({status: 401, description: 'Unauthorized - Invalid credentials'})
    @ApiResponse({status: 404, description: 'Not Found - User not found with the provided ID'})
    async update(@CurrentUser() currentUser: User, @Body() user: UpdateUserDto): Promise<User> {
        return await lastValueFrom(this.userClient.send<User>('UpdateUserCommand', {id: currentUser.id, user}));
    }

    @Put('profile-picture')
    @ApiOperation({summary: 'Update user profile picture'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({type: FileUploadDto})
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponse({status: 200, description: 'Profile picture updated', type: User})
    @ApiResponse({status: 401, description: 'Unauthorized - Invalid credentials'})
    @ApiResponse({status: 404, description: 'Not Found - User not found with the provided ID'})
    async updateProfilePicture(
        @CurrentUser() currentUser: User,
        @UploadedFile() file: Express.Multer.File
    ): Promise<User> {
        const imageUrl = await this.fileUploadService.uploadFile(file.buffer, file.originalname, file.mimetype, 'user');
        return await lastValueFrom(
            this.userClient.send<User>('UpdateProfilePictureUserCommand', {id: currentUser.id, imageUrl})
        );
    }

    @Put('cover-photo')
    @ApiOperation({summary: 'Update user cover photo'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({type: FileUploadDto})
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponse({status: 200, description: 'Cover photo updated', type: User})
    @ApiResponse({status: 401, description: 'Unauthorized - Invalid credentials'})
    @ApiResponse({status: 404, description: 'Not Found - User not found with the provided ID'})
    async updateCoverPhoto(@CurrentUser() currentUser: User, @UploadedFile() file: Express.Multer.File): Promise<User> {
        const imageUrl = await this.fileUploadService.uploadFile(file.buffer, file.originalname, file.mimetype, 'user');
        return await lastValueFrom(
            this.userClient.send<User>('UpdateCoverPhotoUserCommand', {id: currentUser.id, imageUrl})
        );
    }

    @Put('settings')
    @ApiOperation({summary: 'Update user settings'})
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                type: {type: 'string', enum: Object.values(SettingType)},
                value: {type: 'string'},
            },
        },
    })
    @ApiResponse({status: 200, description: 'Settings updated', type: Setting})
    @ApiResponse({status: 401, description: 'Unauthorized - Invalid credentials'})
    @ApiResponse({status: 404, description: 'Not Found - User not found with the provided ID'})
    async updateSettings(
        @CurrentUser() currentUser: User,
        @Body('type') type: SettingType,
        @Body('value') value: string
    ): Promise<Setting> {
        return await lastValueFrom(
            this.userClient.send<Setting>('UpdateSettingsUserCommand', {id: currentUser.id, type, value})
        );
    }

    @Post('security-questions')
    @ApiOperation({summary: 'Set user security questions'})
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                answers: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            questionId: {type: 'string'},
                            answer: {type: 'string'},
                        },
                    },
                },
            },
        },
    })
    @ApiResponse({status: 201, description: 'Security questions set', type: [SecurityAnswer]})
    async setSecurityQuestions(
        @CurrentUser() currentUser: User,
        @Body('answers') answers: {questionId: string; answer: string}[]
    ): Promise<SecurityAnswer[]> {
        return await lastValueFrom(
            this.userClient.send<SecurityAnswer[]>('SetSecurityQuestionsUserCommand', {id: currentUser.id, answers})
        );
    }

    @Put('profile-privacy')
    @ApiOperation({summary: 'Update profile privacy settings'})
    @ApiBody({schema: {type: 'object', properties: {privacy: {type: 'string', enum: Object.values(ProfilePrivacy)}}}})
    @ApiResponse({status: 200, description: 'Profile privacy updated', type: User})
    async updateProfilePrivacy(@CurrentUser() user: User, @Body('privacy') privacy: ProfilePrivacy): Promise<User> {
        return await lastValueFrom(
            this.userClient.send<User>('UpdateProfilePrivacyUserCommand', {id: user.id, privacy})
        );
    }

    @Get(':id')
    @ApiOperation({summary: 'Get user profile by ID'})
    @ApiResponse({status: 200, description: 'Return user profile by ID', type: User})
    @ApiResponse({
        status: 400,
        description: 'Bad Request - Invalid input data',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token',
    })
    @ApiResponse({
        status: 404,
        description: 'Not Found - User not found with the provided ID',
    })
    async getById(@Param('id') id: string): Promise<User> {
        return await lastValueFrom(this.userClient.send<User>('GetByIdUserCommand', {id}));
    }
}

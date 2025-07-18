import {
    Body,
    Controller,
    Get,
    Inject,
    Param,
    Patch,
    Post,
    Put,
    Query,
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
import {SocialLink} from '@/entities/user-module/local/social-link.entity';
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

    @Get('all-users')
    @ApiOperation({summary: 'Get all users - For testing only'})
    @ApiResponse({status: 200, description: 'Return all users (For testing only)', type: [User]})
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token',
    })
    async getList(@CurrentUser() currentUser: User): Promise<User[]> {
        return await lastValueFrom(this.userClient.send<User[]>('GetAllUserCommand', {id: currentUser.id}));
    }

    @Patch()
    @ApiOperation({summary: 'Update user profile information'})
    @ApiBody({type: UpdateUserDto})
    @ApiResponse({status: 200, description: 'Return user after updated', type: User})
    @ApiResponse({status: 401, description: 'Unauthorized - Invalid credentials'})
    @ApiResponse({status: 404, description: 'Not Found - User not found with the provided ID'})
    async update(@CurrentUser() currentUser: User, @Body() user: UpdateUserDto): Promise<User> {
        return await lastValueFrom(this.userClient.send<User>('UpdateUserCommand', {id: currentUser.id, user}));
    }

    @Get('social-links/:id')
    @ApiOperation({summary: 'Get user social links by ID'})
    @ApiResponse({status: 200, description: 'Return social links by ID', type: [SocialLink]})
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
    async getSocialLinks(@Param('id') id: string): Promise<SocialLink[]> {
        return await lastValueFrom(this.userClient.send<SocialLink[]>('GetSocialLinksUserCommand', {userId: id}));
    }

    @Get('user-events/:id')
    @ApiOperation({summary: 'Get user events'})
    @ApiResponse({status: 200, description: 'Return user events', type: [String]})
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
    async getUserEvents(@Param('id') id: string): Promise<string[]> {
        return await lastValueFrom(this.userClient.send<string[]>('GetUserEventsUserCommand', {userId: id}));
    }

    @Get('biography/:id')
    @ApiOperation({summary: 'Get user biography'})
    @ApiResponse({status: 200, description: 'Return user biography', type: String})
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
    async getBiography(@Param('id') id: string): Promise<string> {
        return await lastValueFrom(this.userClient.send<string>('GetBiographyUserCommand', {userId: id}));
    }

    @Put('social-links/:id')
    @ApiOperation({summary: 'Update user social links'})
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                socialLinks: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: {type: 'string'},
                            type: {type: 'string', enum: Object.values(SocialLink)},
                            link: {type: 'string'},
                        },
                    },
                },
            },
        },
    })
    @ApiResponse({status: 200, description: 'Return user social links', type: [SocialLink]})
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                socialLinks: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            type: {type: 'string', example: 'FACEBOOK'},
                            link: {type: 'string', example: 'https://facebook.com/user'},
                        },
                    },
                },
            },
        },
    })
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
    async updateSocialLinks(
        @Param('id') id: string,
        @Body('socialLinks') socialLinks: {id: string; type: SocialLink; link: string}[]
    ): Promise<SocialLink[]> {
        return await lastValueFrom(
            this.userClient.send<SocialLink[]>('UpdateSocialLinksUserCommand', {userId: id, socialLinks})
        );
    }

    @Put('biography')
    @ApiOperation({summary: 'Update user biography'})
    @ApiBody({schema: {type: 'object', properties: {biography: {type: 'string', example: 'New biography'}}}})
    @ApiResponse({status: 200, description: 'Return user after updated', type: User})
    @ApiResponse({status: 401, description: 'Unauthorized - Invalid credentials'})
    async updateBiography(@CurrentUser() currentUser: User, @Body('biography') biography: string): Promise<User> {
        return await lastValueFrom(
            this.userClient.send<User>('UpdateBiographyUserCommand', {userId: currentUser.id, biography})
        );
    }

    @Put('user-events')
    @ApiOperation({summary: 'Update user events'})
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                events: {
                    type: 'array',
                    items: {type: 'string'},
                },
            },
        },
    })
    @ApiResponse({status: 200, description: 'Return user after updated', type: User})
    @ApiResponse({status: 401, description: 'Unauthorized - Invalid credentials'})
    @ApiResponse({status: 404, description: 'Not Found - User not found with the provided ID'})
    async updateUserEvents(@CurrentUser() currentUser: User, @Body('events') events: string[]): Promise<User> {
        return await lastValueFrom(
            this.userClient.send<User>('UpdateUserEventsUserCommand', {userId: currentUser.id, events})
        );
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

    @Post('follow/:id')
    @UseGuards(JwtBlacklistGuard, JWTAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({summary: 'Follow a user'})
    @ApiResponse({
        status: 200,
        description: 'User followed successfully',
    })
    async followUser(@CurrentUser() user: User, @Param('id') followingId: string): Promise<any> {
        return lastValueFrom(
            this.userClient.send('FollowUserCommand', {
                userId: user.id,
                followingId,
            })
        );
    }

    @Post('unfollow/:id')
    @UseGuards(JwtBlacklistGuard, JWTAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({summary: 'Unfollow a user'})
    @ApiResponse({
        status: 200,
        description: 'User unfollowed successfully',
    })
    async unfollowUser(@CurrentUser() user: User, @Param('id') followingId: string): Promise<any> {
        return lastValueFrom(
            this.userClient.send('UnfollowUserCommand', {
                userId: user.id,
                followingId,
            })
        );
    }

    @Get('followers/:id')
    @UseGuards(JwtBlacklistGuard, JWTAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({summary: 'Get user followers'})
    @ApiResponse({
        status: 200,
        description: 'User followers retrieved successfully',
    })
    async getFollowers(@Param('id') userId: string, @Query('page') page = 1, @Query('limit') limit = 10): Promise<any> {
        return lastValueFrom(
            this.userClient.send('GetFollowersCommand', {
                userId,
                page,
                limit,
            })
        );
    }

    @Get('following/:id')
    @UseGuards(JwtBlacklistGuard, JWTAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({summary: 'Get users followed by the user'})
    @ApiResponse({
        status: 200,
        description: 'User following retrieved successfully',
    })
    async getFollowing(@Param('id') userId: string, @Query('page') page = 1, @Query('limit') limit = 10): Promise<any> {
        return lastValueFrom(
            this.userClient.send('GetFollowingCommand', {
                userId,
                page,
                limit,
            })
        );
    }
}

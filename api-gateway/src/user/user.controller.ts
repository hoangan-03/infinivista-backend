// import {
//     Body,
//     Controller,
//     Delete,
//     Get,
//     Inject,
//     Param,
//     Patch,
//     Post,
//     Put,
//     Query,
//     UploadedFile,
//     UseGuards,
//     UseInterceptors,
// } from '@nestjs/common';
// import {ClientProxy} from '@nestjs/microservices';
// import {FileInterceptor} from '@nestjs/platform-express';
// import {ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags} from '@nestjs/swagger';
// import {lastValueFrom} from 'rxjs';

// import {UpdateUserDto} from '@/auth/dtos/update-user.dto';
// import {CurrentUser} from '@/decorators/user.decorator';
// import {FileUploadDto} from '@/dtos/common/file-upload.dto';
// import {PaginationDto} from '@/dtos/common/pagination.dto';
// import {FriendRequest} from '@/entities/user-module/local/friend-request.entity';
// import {SecurityAnswer} from '@/entities/user-module/local/security-answer.entity';
// import {Setting} from '@/entities/user-module/local/setting.entity';
// import {User} from '@/entities/user-module/local/user.entity';
// import {ProfilePrivacy} from '@/enums/user-module/profile-privacy.enum';
// import {SettingType} from '@/enums/user-module/setting.enum';
// import {JWTAuthGuard} from '@/guards/jwt-auth.guard';
// import {JwtBlacklistGuard} from '@/guards/jwt-blacklist.guard';
// import {PaginationResponseInterface} from '@/interfaces/common/pagination-response.interface';
// import {FileUploadService} from '@/services/file-upload.service';

// @ApiTags('Users-Redundant')
// @ApiBearerAuth()
// @UseGuards(JwtBlacklistGuard, JWTAuthGuard)
// @Controller('users')
// export class UserController {
//     constructor(
//         @Inject('USER_SERVICE') private userClient: ClientProxy,
//         private fileUploadService: FileUploadService
//     ) {}
//     @Get()
//     @ApiTags('Users')
//     @ApiOperation({summary: 'Get all users - For testing only'})
//     @ApiResponse({status: 200, description: 'Return all users (For testing only)', type: [User]})
//     @ApiResponse({
//         status: 401,
//         description: 'Unauthorized - Invalid or missing token',
//     })
//     async getList(): Promise<User[]> {
//         return await lastValueFrom(this.userClient.send<User[]>('GetAllUserCommand', {}));
//     }

//     @Patch('/profile')
//     @ApiTags('Profile')
//     @ApiOperation({summary: 'Update user profile information'})
//     @ApiBody({type: UpdateUserDto})
//     @ApiResponse({status: 200, description: 'Return user after updated', type: User})
//     @ApiResponse({
//         status: 401,
//         description: 'Unauthorized - Invalid credentials',
//     })
//     @ApiResponse({
//         status: 404,
//         description: 'Not Found - User not found with the provided ID',
//     })
//     async update(@CurrentUser() currentUser, @Body() user: UpdateUserDto): Promise<User> {
//         return await lastValueFrom(this.userClient.send<User>('UpdateUserCommand', {id: currentUser.id, user}));
//     }

//     @Put('/profile/profile-picture')
//     @ApiTags('Profile')
//     @ApiOperation({summary: 'Update user profile picture'})
//     @ApiConsumes('multipart/form-data')
//     @ApiBody({
//         type: FileUploadDto,
//     })
//     @UseInterceptors(FileInterceptor('file'))
//     @ApiResponse({
//         status: 200,
//         description: 'Profile picture updated',
//         type: User,
//     })
//     @ApiResponse({
//         status: 401,
//         description: 'Unauthorized - Invalid credentials',
//     })
//     @ApiResponse({
//         status: 404,
//         description: 'Not Found - User not found with the provided ID',
//     })
//     async updateProfilePicture(
//         @CurrentUser() currentUser: User,
//         @UploadedFile() file: Express.Multer.File
//     ): Promise<User> {
//         // Upload file to Google Drive
//         const imageUrl = await this.fileUploadService.uploadFile(file.buffer, file.originalname, file.mimetype, 'user');

//         return await lastValueFrom(
//             this.userClient.send<User>('UpdateProfilePictureUserCommand', {id: currentUser.id, imageUrl})
//         );
//     }

//     @Put('/profile/cover-photo')
//     @ApiTags('Profile')
//     @ApiOperation({summary: 'Update user cover photo'})
//     @ApiConsumes('multipart/form-data')
//     @ApiBody({
//         type: FileUploadDto,
//     })
//     @UseInterceptors(FileInterceptor('file'))
//     @ApiResponse({status: 200, description: 'Cover photo updated', type: User})
//     @ApiResponse({
//         status: 401,
//         description: 'Unauthorized - Invalid credentials',
//     })
//     @ApiResponse({
//         status: 404,
//         description: 'Not Found - User not found with the provided ID',
//     })
//     async updateCoverPhoto(@CurrentUser() currentUser: User, @UploadedFile() file: Express.Multer.File): Promise<User> {
//         // Upload file to Google Drive
//         const imageUrl = await this.fileUploadService.uploadFile(file.buffer, file.originalname, file.mimetype, 'user');

//         return await lastValueFrom(
//             this.userClient.send<User>('UpdateCoverPhotoUserCommand', {id: currentUser.id, imageUrl})
//         );
//     }

//     @Put('/settings')
//     @ApiTags('Profile')
//     @ApiOperation({summary: 'Update user settings'})
//     @ApiBody({
//         schema: {
//             type: 'object',
//             properties: {
//                 type: {
//                     type: 'string',
//                     enum: Object.values(SettingType),
//                 },
//                 value: {
//                     type: 'string',
//                 },
//             },
//         },
//     })
//     @ApiResponse({status: 200, description: 'Settings updated', type: Setting})
//     @ApiResponse({
//         status: 401,
//         description: 'Unauthorized - Invalid credentials',
//     })
//     @ApiResponse({
//         status: 404,
//         description: 'Not Found - User not found with the provided ID',
//     })
//     async updateSettings(
//         @CurrentUser() currentUser: User,
//         @Body('type') type: SettingType,
//         @Body('value') value: string
//     ): Promise<Setting> {
//         return await lastValueFrom(
//             this.userClient.send<Setting>('UpdateSettingsUserCommand', {id: currentUser.id, type, value})
//         );
//     }

//     @Post('/profile/security-questions')
//     @ApiTags('Profile')
//     @ApiOperation({summary: 'Set user security questions'})
//     @ApiBody({
//         schema: {
//             type: 'object',
//             properties: {
//                 answers: {
//                     type: 'array',
//                     items: {
//                         type: 'object',
//                         properties: {
//                             questionId: {type: 'string'},
//                             answer: {type: 'string'},
//                         },
//                     },
//                 },
//             },
//         },
//     })
//     @ApiResponse({
//         status: 201,
//         description: 'Security questions set',
//         type: [SecurityAnswer],
//     })
//     async setSecurityQuestions(
//         @CurrentUser() currentUser: User,
//         @Body('answers') answers: {questionId: string; answer: string}[]
//     ): Promise<SecurityAnswer[]> {
//         return await lastValueFrom(
//             this.userClient.send<SecurityAnswer[]>('SetSecurityQuestionsUserCommand', {id: currentUser.id, answers})
//         );
//     }

//     @Put('/profile/profile-privacy')
//     @ApiTags('Profile')
//     @ApiOperation({summary: 'Update profile privacy settings'})
//     async updateProfilePrivacy(@CurrentUser() user: User, @Body('privacy') privacy: ProfilePrivacy): Promise<User> {
//         return await lastValueFrom(
//             this.userClient.send<User>('UpdateProfilePrivacyUserCommand', {id: user.id, privacy})
//         );
//     }

//     @Get('friend')
//     @ApiTags('Friend')
//     @ApiOperation({summary: 'Get paginated list of friends for current user'})
//     @ApiQuery({type: PaginationDto})
//     @ApiResponse({
//         status: 200,
//         description: 'Returns paginated list of friends',
//     })
//     async getFriends(
//         @CurrentUser() user,
//         @Query() paginationDto: PaginationDto
//     ): Promise<PaginationResponseInterface<User>> {
//         console.log('Fetching friends for user:', user.id);
//         return await lastValueFrom(
//             this.userClient.send('GetFriendsUserCommand', {
//                 userId: user.id,
//                 page: paginationDto.page,
//                 limit: paginationDto.limit,
//             })
//         );
//     }

//     @Get(':id')
//     @ApiTags('Profile')
//     @ApiOperation({summary: 'Get user by ID'})
//     @ApiResponse({status: 200, description: 'Return user by ID', type: User})
//     @ApiResponse({
//         status: 400,
//         description: 'Bad Request - Invalid input data',
//     })
//     @ApiResponse({
//         status: 401,
//         description: 'Unauthorized - Invalid or missing token',
//     })
//     @ApiResponse({
//         status: 404,
//         description: 'Not Found - User not found with the provided ID',
//     })
//     async getById(@Param('id') id: string): Promise<User> {
//         return await lastValueFrom(this.userClient.send<User>('GetByIdUserCommand', {id}));
//     }

//     @Get('friend/requests')
//     @ApiTags('Friend')
//     @ApiResponse({
//         status: 200,
//         description: 'Return all friend requests',
//         type: [FriendRequest],
//     })
//     @ApiResponse({
//         status: 401,
//         description: 'Unauthorized - Invalid or missing token',
//     })
//     @ApiOperation({summary: 'Get paginated friend requests of current user'})
//     @ApiQuery({type: PaginationDto})
//     async getFriendRequests(
//         @CurrentUser() user,
//         @Query() paginationDto: PaginationDto
//     ): Promise<PaginationResponseInterface<FriendRequest>> {
//         return await lastValueFrom(
//             this.userClient.send('GetFriendRequestsUserCommand', {
//                 userId: user.id,
//                 page: paginationDto.page,
//                 limit: paginationDto.limit,
//             })
//         );
//     }

//     @Delete('friend/:friendId')
//     @ApiTags('Friend')
//     @ApiResponse({
//         status: 200,
//         description: 'Friend removed successfully',
//     })
//     @ApiResponse({
//         status: 401,
//         description: 'Unauthorized - Invalid or missing token',
//     })
//     @ApiResponse({
//         status: 404,
//         description: 'Not Found - Friend not found with the provided ID',
//     })
//     @ApiOperation({summary: 'Remove friend'})
//     async removeFriend(@CurrentUser() user, @Param('friendId') friendId: string): Promise<{success: boolean}> {
//         return await lastValueFrom(this.userClient.send('RemoveFriendUserCommand', {userId: user.id, friendId}));
//     }

//     @Post('friend/request/:recipientId')
//     @ApiTags('Friend')
//     @ApiResponse({
//         status: 201,
//         description: 'Friend request sent',
//         type: FriendRequest,
//     })
//     @ApiResponse({
//         status: 401,
//         description: 'Unauthorized - Invalid or missing token',
//     })
//     @ApiOperation({summary: 'Send friend request'})
//     async sendFriendRequest(@CurrentUser() user, @Param('recipientId') recipientId: string): Promise<FriendRequest> {
//         return await lastValueFrom(
//             this.userClient.send('SendFriendRequestUserCommand', {senderId: user.id, recipientId})
//         );
//     }

//     @Put('friend/request/:requestId')
//     @ApiTags('Friend')
//     @ApiBody({
//         schema: {
//             type: 'object',
//             properties: {
//                 accept: {
//                     type: 'boolean',
//                     description: 'Whether to accept the friend request',
//                 },
//             },
//         },
//     })
//     @ApiResponse({
//         status: 200,
//         description: 'Friend request response',
//     })
//     @ApiResponse({
//         status: 400,
//         description: 'Bad Request - Invalid input data',
//     })
//     @ApiResponse({
//         status: 401,
//         description: 'Unauthorized - Invalid or missing token',
//     })
//     @ApiOperation({summary: 'Accept or decline friend request'})
//     async respondToRequest(
//         @Param('requestId') requestId: string,
//         @Body('accept') accept: boolean
//     ): Promise<{success: boolean}> {
//         await lastValueFrom(
//             this.userClient.send('RespondToFriendRequestUserCommand', {
//                 requestId,
//                 accept,
//             })
//         );
//         return {success: true};
//     }

//     // @Put(':id/online-status')
//     // @ApiOperation({summary: 'Toggle user online status'})
//     // @ApiBody({
//     //     schema: {
//     //         type: 'object',
//     //         properties: {
//     //             isOnline: {
//     //                 type: 'boolean',
//     //             },
//     //         },
//     //     },
//     // })
//     // @ApiResponse({
//     //     status: 200,
//     //     description: 'Online status updated',
//     //     type: User,
//     // })
//     // async toggleOnlineStatus(@Param('id') id: string, @Body('isOnline') isOnline: boolean): Promise<User> {
//     //     return await lastValueFrom(this.userClient.send<User>('ToggleOnlineStatusUserCommand', {id, isOnline}));
//     // }

//     // @Put(':id/suspend')
//     // @ApiOperation({summary: 'Suspend/unsuspend user'})
//     // @ApiBody({
//     //     schema: {
//     //         type: 'object',
//     //         properties: {
//     //             suspended: {
//     //                 type: 'boolean',
//     //             },
//     //         },
//     //     },
//     // })
//     // @ApiResponse({
//     //     status: 200,
//     //     description: 'User suspension status updated',
//     //     type: User,
//     // })
//     // async suspendUser(@Param('id') id: string, @Body('suspended') suspended: boolean): Promise<User> {
//     //     return await lastValueFrom(this.userClient.send<User>('SuspendUserCommand', {id, suspended}));
//     // }

//     // @Get(':id/full-profile')
//     // @ApiOperation({
//     //     summary: "Get user's full profile including settings and security questions",
//     // })
//     // @ApiResponse({status: 200, description: 'Full user profile', type: User})
//     // async getFullProfile(@Param('id') id: string): Promise<User> {
//     //     return await lastValueFrom(this.userClient.send<User>('GetProfileUserCommand', {id}));
//     // }

//     // @Put('/account/suspend')
//     // @ApiOperation({summary: 'Temporarily suspend account'})
//     // async suspendAccount(@CurrentUser() user: User): Promise<User> {
//     //     return await lastValueFrom(this.userClient.send<User>('SuspendAccountUserCommand', {id: user.id}));
//     // }

//     // @Put('/account/unsuspend')
//     // @ApiOperation({summary: 'Reactivate suspended account'})
//     // async unsuspendAccount(@CurrentUser() user: User): Promise<User> {
//     //     return await lastValueFrom(this.userClient.send<User>('UnsuspendAccountUserCommand', {id: user.id}));
//     // }

//     // @Delete('/account')
//     // @ApiOperation({summary: 'Permanently delete account'})
//     // async deleteAccount(@CurrentUser() user: User): Promise<void> {
//     //     return await lastValueFrom(this.userClient.send<void>('DeleteUserCommand', {id: user.id}));
//     // }
// }

// import {Body, Controller, Delete, Get, Inject, Param, Patch, Post, Put, UseGuards} from '@nestjs/common';
// import {ClientProxy} from '@nestjs/microservices';
// import {ApiBody, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
// import {lastValueFrom} from 'rxjs';
// import {User} from 'src/entities/user-module/user.entity';

// import {CurrentUser} from '@/decorators/user.decorator';
// import {UpdateUserDto} from '@/dtos/user-module/update-user.dto';
// import {SecurityAnswer} from '@/entities/user-module/security-answer.entity';
// import {Setting} from '@/entities/user-module/setting.entity';
// import {ProfilePrivacy} from '@/enums/user-module/profile-privacy.enum';
// import {SettingType} from '@/enums/user-module/setting.enum';
// import {JWTAuthGuard} from '@/guards/jwt-auth.guard';

// @ApiTags('Users')
// @Controller('users')
// export class UserController {
//     constructor(@Inject('USER_SERVICE') private userClient: ClientProxy) {}
//     @Get('test')
//     async test(): Promise<string> {
//         return await lastValueFrom(this.userClient.send<string>('TestUserCommand', {}));
//     }

//     @Get('test/:amount')
//     async testAmount(@Param('amount') amount: number): Promise<string> {
//         return await lastValueFrom(this.userClient.send<string>('TestAmountUserCommand', {amount}));
//     }

//     @Get()
//     @ApiOperation({summary: 'Get all users'})
//     @ApiResponse({status: 200, description: 'Return all users', type: [User]})
//     @ApiResponse({
//         status: 401,
//         description: 'Unauthorized - Invalid or missing token',
//     })
//     async getList(): Promise<User[]> {
//         return await lastValueFrom(this.userClient.send<User[]>('GetAllUserCommand', {}));
//     }

//     @Get(':id')
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

//     @Patch(':id')
//     @ApiOperation({summary: 'Update user'})
//     @ApiBody({type: UpdateUserDto})
//     @ApiResponse({status: 200, description: 'Return updated user', type: User})
//     @ApiResponse({
//         status: 401,
//         description: 'Unauthorized - Invalid credentials',
//     })
//     @ApiResponse({
//         status: 404,
//         description: 'Not Found - User not found with the provided ID',
//     })
//     async update(@Param('id') id: string, @Body() user: UpdateUserDto): Promise<User> {
//         return await lastValueFrom(this.userClient.send<User>('UpdateUserCommand', {id, user}));
//     }

//     @Put(':id/profile-picture')
//     @ApiOperation({summary: 'Update user profile picture'})
//     @ApiBody({
//         schema: {
//             type: 'object',
//             properties: {
//                 imageUrl: {
//                     type: 'string',
//                     example: 'https://example.com/image.jpg',
//                 },
//             },
//         },
//     })
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
//     async updateProfilePicture(@Param('id') id: string, @Body('imageUrl') imageUrl: string): Promise<User> {
//         return await lastValueFrom(this.userClient.send<User>('UpdateProfilePictureUserCommand', {id, imageUrl}));
//     }

//     @Put(':id/cover-photo')
//     @ApiOperation({summary: 'Update user cover photo'})
//     @ApiBody({
//         schema: {
//             type: 'object',
//             properties: {
//                 imageUrl: {
//                     type: 'string',
//                     example: 'https://example.com/cover.jpg',
//                 },
//             },
//         },
//     })
//     @ApiResponse({status: 200, description: 'Cover photo updated', type: User})
//     @ApiResponse({
//         status: 401,
//         description: 'Unauthorized - Invalid credentials',
//     })
//     @ApiResponse({
//         status: 404,
//         description: 'Not Found - User not found with the provided ID',
//     })
//     async updateCoverPhoto(@Param('id') id: string, @Body('imageUrl') imageUrl: string): Promise<User> {
//         return await lastValueFrom(this.userClient.send<User>('UpdateCoverPhotoUserCommand', {id, imageUrl}));
//     }

//     @Put(':id/settings')
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
//         @Param('id') id: string,
//         @Body('type') type: SettingType,
//         @Body('value') value: string
//     ): Promise<Setting> {
//         return await lastValueFrom(this.userClient.send<Setting>('UpdateSettingsUserCommand', {id, type, value}));
//     }

//     @Post(':id/security-questions')
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
//         @Param('id') id: string,
//         @Body('answers') answers: {questionId: string; answer: string}[]
//     ): Promise<SecurityAnswer[]> {
//         return await lastValueFrom(
//             this.userClient.send<SecurityAnswer[]>('SetSecurityQuestionsUserCommand', {id, answers})
//         );
//     }

//     @Put(':id/online-status')
//     @ApiOperation({summary: 'Toggle user online status'})
//     @ApiBody({
//         schema: {
//             type: 'object',
//             properties: {
//                 isOnline: {
//                     type: 'boolean',
//                 },
//             },
//         },
//     })
//     @ApiResponse({
//         status: 200,
//         description: 'Online status updated',
//         type: User,
//     })
//     async toggleOnlineStatus(@Param('id') id: string, @Body('isOnline') isOnline: boolean): Promise<User> {
//         return await lastValueFrom(this.userClient.send<User>('ToggleOnlineStatusUserCommand', {id, isOnline}));
//     }

//     @Put(':id/suspend')
//     @ApiOperation({summary: 'Suspend/unsuspend user'})
//     @ApiBody({
//         schema: {
//             type: 'object',
//             properties: {
//                 suspended: {
//                     type: 'boolean',
//                 },
//             },
//         },
//     })
//     @ApiResponse({
//         status: 200,
//         description: 'User suspension status updated',
//         type: User,
//     })
//     async suspendUser(@Param('id') id: string, @Body('suspended') suspended: boolean): Promise<User> {
//         return await lastValueFrom(this.userClient.send<User>('SuspendUserCommand', {id, suspended}));
//     }

//     @Get(':id/full-profile')
//     @ApiOperation({
//         summary: "Get user's full profile including settings and security questions",
//     })
//     @ApiResponse({status: 200, description: 'Full user profile', type: User})
//     async getFullProfile(@Param('id') id: string): Promise<User> {
//         return await lastValueFrom(this.userClient.send<User>('GetProfileUserCommand', {id}));
//     }

//     @Put(':id/suspend')
//     @UseGuards(JWTAuthGuard)
//     @ApiOperation({summary: 'Temporarily suspend account'})
//     async suspendAccount(@CurrentUser() user: User): Promise<User> {
//         return await lastValueFrom(this.userClient.send<User>('SuspendAccountUserCommand', {id: user.id}));
//     }

//     @Put(':id/unsuspend')
//     @UseGuards(JWTAuthGuard)
//     @ApiOperation({summary: 'Reactivate suspended account'})
//     async unsuspendAccount(@CurrentUser() user: User): Promise<User> {
//         return await lastValueFrom(this.userClient.send<User>('UnsuspendAccountUserCommand', {id: user.id}));
//     }

//     @Delete(':id')
//     @UseGuards(JWTAuthGuard)
//     @ApiOperation({summary: 'Permanently delete account'})
//     async deleteAccount(@CurrentUser() user: User): Promise<void> {
//         return await lastValueFrom(this.userClient.send<void>('DeleteUserCommand', {id: user.id}));
//     }

//     @Put(':id/profile-privacy')
//     @UseGuards(JWTAuthGuard)
//     @ApiOperation({summary: 'Update profile privacy settings'})
//     async updateProfilePrivacy(@CurrentUser() user: User, @Body('privacy') privacy: ProfilePrivacy): Promise<User> {
//         return await lastValueFrom(
//             this.userClient.send<User>('UpdateProfilePrivacyUserCommand', {id: user.id, privacy})
//         );
//     }
// }

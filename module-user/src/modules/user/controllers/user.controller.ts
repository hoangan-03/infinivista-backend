import {UseGuards} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';

import {SecurityAnswer} from '@/entities/local/security-answer.entity';
import {Setting} from '@/entities/local/setting.entity';
import {User} from '@/entities/local/user.entity';
import {UpdateUserDto} from '@/modules/user/dto/update-user.dto';
import {SettingType} from '@/modules/user/enums/setting.enum';
import {UserService} from '@/modules/user/services/user.service';

import {ProfilePrivacy} from '../enums/profile-privacy.enum';
import {Controller} from '@nestjs/common';

@Controller()
export class UserController {
    constructor(private readonly userService: UserService) {}
    @MessagePattern('TestUserCommand')
    async test(): Promise<string> {
        return 'This is a test';
    }

    @MessagePattern('TestAmountUserCommand')
    async testAmount(payload: {amount: number}): Promise<string> {
        return `This is a test with amount: ${payload.amount}.\nHere is twice the amount: ${payload.amount * 2}`;
    }

    @MessagePattern('GetAllUserCommand')
    async getList(): Promise<User[]> {
        return this.userService.getAll();
    }

    @MessagePattern('GetByIdUserCommand')
    async getById(payload: {id: string}): Promise<User> {
        return this.userService.getOne({where: {id: payload.id}});
    }

    @MessagePattern('UpdateUserCommand')
    async update(payload: {id: string; user: UpdateUserDto}): Promise<User> {
        return this.userService.updateProfile(payload.id, payload.user);
    }

    @MessagePattern('UpdateProfilePictureUserCommand')
    async updateProfilePicture(payload: {id: string; imageUrl: string}): Promise<User> {
        return this.userService.updateProfilePicture(payload.id, payload.imageUrl);
    }

    @MessagePattern('UpdateCoverPhotoUserCommand')
    async updateCoverPhoto(payload: {id: string; imageUrl: string}): Promise<User> {
        return this.userService.updateCoverPhoto(payload.id, payload.imageUrl);
    }

    @MessagePattern('UpdateSettingsUserCommand')
    async updateSettings(payload: {id: string; type: SettingType; value: string}): Promise<Setting> {
        return this.userService.updateUserSettings(payload.id, payload.type, payload.value);
    }

    @MessagePattern('SetSecurityQuestionsUserCommand')
    async setSecurityQuestions(payload: {
        id: string;
        answers: {questionId: string; answer: string}[];
    }): Promise<SecurityAnswer[]> {
        return this.userService.setSecurityQuestions(payload.id, payload.answers);
    }

    @MessagePattern('ToggleOnlineStatusUserCommand')
    async toggleOnlineStatus(payload: {id: string; isOnline: boolean}): Promise<User> {
        return this.userService.toggleOnlineStatus(payload.id, payload.isOnline);
    }

    @MessagePattern('SuspendUserCommand')
    async suspendUser(payload: {id: string; suspended: boolean}): Promise<User> {
        return this.userService.suspendUser(payload.id, payload.suspended);
    }

    @MessagePattern('GetProfileUserCommand')
    async getFullProfile(payload: {id: string}): Promise<User> {
        return this.userService.getUserWithFullProfile(payload.id);
    }

    @MessagePattern('SuspendAccountUserCommand')
    async suspendAccount(payload: {id: string}): Promise<User> {
        return this.userService.suspendAccount(payload.id);
    }

    @MessagePattern('UnsuspendAccountUserCommand')
    async unsuspendAccount(payload: {id: string}): Promise<User> {
        return this.userService.unsuspendAccount(payload.id);
    }

    @MessagePattern('DeleteUserCommand')
    async deleteAccount(payload: {id: string}): Promise<void> {
        return this.userService.deleteAccount(payload.id);
    }

    @MessagePattern('UpdateProfilePrivacyUserCommand')
    async updateProfilePrivacy(payload: {id: string; privacy: ProfilePrivacy}): Promise<User> {
        return this.userService.updateProfilePrivacy(payload.id, payload.privacy);
    }
}

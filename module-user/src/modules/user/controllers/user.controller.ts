import {Controller} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';

import {FriendRequest} from '@/entities/local/friend-request.entity';
import {SecurityAnswer} from '@/entities/local/security-answer.entity';
import {Setting} from '@/entities/local/setting.entity';
import {User} from '@/entities/local/user.entity';
import {PaginationResponseInterface} from '@/interfaces/pagination-response.interface';
import {UpdateUserDto} from '@/modules/user/dto/update-user.dto';
import {SettingType} from '@/modules/user/enums/setting.enum';
import {UserService} from '@/modules/user/services/user.service';

import {ProfilePrivacy} from '../enums/profile-privacy.enum';
import {FriendService} from '../services/friend.service';

@Controller()
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly friendService: FriendService
    ) {}

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

    @MessagePattern('UpdateProfilePrivacyUserCommand')
    async updateProfilePrivacy(payload: {id: string; privacy: ProfilePrivacy}): Promise<User> {
        return this.userService.updateProfilePrivacy(payload.id, payload.privacy);
    }

    @MessagePattern('GetFriendsUserCommand')
    async getFriends(payload: {
        userId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<User>> {
        return this.friendService.getFriends(payload.userId, payload.page, payload.limit);
    }

    @MessagePattern('GetFriendRequestsUserCommand')
    async getFriendRequests(payload: {
        userId: string;
        page?: number;
        limit?: number;
    }): Promise<PaginationResponseInterface<FriendRequest>> {
        return this.friendService.getFriendRequests(payload.userId, payload.page, payload.limit);
    }
}

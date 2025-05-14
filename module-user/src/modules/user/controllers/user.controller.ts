import {Controller} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';

import {FriendRequest} from '@/entities/local/friend-request.entity';
import {SecurityAnswer} from '@/entities/local/security-answer.entity';
import {Setting} from '@/entities/local/setting.entity';
import {SocialLink} from '@/entities/local/social-link.entity';
import {User} from '@/entities/local/user.entity';
import {PaginationResponseInterface} from '@/interfaces/pagination-response.interface';
import {UpdateUserDto} from '@/modules/user/dto/update-user.dto';
import {SettingType} from '@/modules/user/enums/setting.enum';
import {UserService} from '@/modules/user/services/user.service';
import {FileUploadService} from '@/services/file-upload.service';

import {FileUploadDto, FileUploadResponseDto} from '../dto/file-upload.dto';
import {ProfilePrivacy} from '../enums/profile-privacy.enum';
import {FriendService} from '../services/friend.service';

@Controller()
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly friendService: FriendService,
        private readonly fileUploadService: FileUploadService
    ) {}

    @MessagePattern('GetAllUserCommand')
    async getList(payload: {id: string}): Promise<User[]> {
        if (payload.id) {
            return this.userService.getAll();
        } else {
            return this.userService.getAll();
        }
    }

    @MessagePattern('GetByIdUserCommand')
    async getById(payload: {id: string}): Promise<User> {
        return this.userService.getUserProfile({where: {id: payload.id}});
    }

    @MessagePattern('GetSocialLinksUserCommand')
    async getSocialLinks(payload: {userId: string}): Promise<SocialLink[]> {
        return this.userService.getSocialLinks(payload.userId);
    }

    @MessagePattern('GetUserEventsUserCommand')
    async getUserEvents(payload: {userId: string}): Promise<string[]> {
        return this.userService.getUserEvents(payload.userId);
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

    @MessagePattern('GetBiographyUserCommand')
    async getBiography(payload: {userId: string}): Promise<string> {
        return this.userService.getUserBiography(payload.userId);
    }

    @MessagePattern('UpdateBiographyUserCommand')
    async updateBiography(payload: {userId: string; biography: string}): Promise<User> {
        return this.userService.updateBiography(payload.userId, payload.biography);
    }

    @MessagePattern('UpdateSocialLinksUserCommand')
    async updateSocialLinks(payload: {userId: string; socialLinks: SocialLink[]}): Promise<SocialLink[]> {
        return this.userService.updateSocialLinks(payload.userId, payload.socialLinks);
    }

    @MessagePattern('UpdateUserEventsUserCommand')
    async updateUserEvents(payload: {userId: string; events: string[]}): Promise<User> {
        return this.userService.addUserEvent(payload.userId, payload.events);
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

    /**
     * Handle file uploads
     */
    @MessagePattern('UploadCoverPhotoCommand')
    async uploadAttachmentFile(payload: FileUploadDto): Promise<FileUploadResponseDto> {
        const url = await this.fileUploadService.uploadFile(
            Buffer.from(payload.buffer),
            payload.fileName,
            payload.mimeType
        );

        return {
            url,
            fileName: payload.fileName,
            mimeType: payload.mimeType,
        };
    }
}

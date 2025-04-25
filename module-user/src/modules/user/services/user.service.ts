import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {FindOneOptions, Repository} from 'typeorm';
import {validate as uuidValidate} from 'uuid';

import {SecurityAnswer} from '@/entities/local/security-answer.entity';
import {Setting} from '@/entities/local/setting.entity';
import {User} from '@/entities/local/user.entity';
import {UpdateUserDto} from '@/modules/user/dto/update-user.dto';
import {SettingType} from '@/modules/user/enums/setting.enum';

import {ProfilePrivacy} from '../enums/profile-privacy.enum';
import {UserEventsService} from './user-events.service';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Setting)
        private readonly settingRepository: Repository<Setting>,
        @InjectRepository(SecurityAnswer)
        private readonly securityAnswerRepository: Repository<SecurityAnswer>,
        private readonly userEventsService: UserEventsService
    ) {}

    // User Management
    async create(data: Partial<User>): Promise<User> {
        const user = this.userRepository.create(data);
        const savedUser = await this.userRepository.save(user);

        // Publish user created event
        await this.userEventsService.publishUserCreated({
            id: savedUser.id,
        });

        return savedUser;
    }
    async getAll(): Promise<User[]> {
        return this.userRepository.find();
    }

    async getOne(options: FindOneOptions<User>): Promise<User> {
        if (options.where && 'id' in options.where) {
            const id = options.where.id as string;
            if (!uuidValidate(id)) {
                throw new BadRequestException('Invalid UUID format');
            }
        }
        const user = await this.userRepository.findOne(options);
        if (!user) {
            const identifier = options.where
                ? Object.entries(options.where)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(', ')
                : 'unknown';

            throw new NotFoundException(`There isn't any user with id:  ${identifier}`);
        }
        const userWithoutPassword = {...user};
        delete userWithoutPassword.password;
        return userWithoutPassword;
    }

    // Profile Management
    async updateProfile(id: string, updates: UpdateUserDto): Promise<User> {
        const user = await this.getOne({where: {id}});
        if (!user) {
            throw new NotFoundException(`There isn't any user with id: ${id}`);
        }
        this.userRepository.merge(user, updates);
        const updatedUser = await this.userRepository.save(user);

        // Publish user updated event
        await this.userEventsService.publishUserUpdated({
            id: updatedUser.id,
        });

        return updatedUser;
    }

    async updateProfilePicture(id: string, imageUrl: string): Promise<User> {
        const user = await this.getOne({where: {id}});
        if (!user) {
            throw new NotFoundException(`There isn't any user with id: ${id}`);
        }
        user.profileImageUrl = imageUrl;
        const updatedUser = await this.userRepository.save(user);

        return updatedUser;
    }

    async updateCoverPhoto(id: string, imageUrl: string): Promise<User> {
        const user = await this.getOne({where: {id}});
        if (!user) {
            throw new NotFoundException(`There isn't any user with id: ${id}`);
        }
        user.coverImageUrl = imageUrl;
        return this.userRepository.save(user);
    }

    // Settings Management
    async updateUserSettings(userId: string, type: SettingType, value: string): Promise<Setting> {
        let setting = await this.settingRepository.findOne({
            where: {user_id: userId, type},
        });

        if (!setting) {
            setting = this.settingRepository.create({
                user_id: userId,
                type,
                value,
            });
        } else {
            setting.value = value;
        }

        return this.settingRepository.save(setting);
    }

    // Security Management
    async setSecurityQuestions(
        userId: string,
        answers: {questionId: string; answer: string}[]
    ): Promise<SecurityAnswer[]> {
        const savedAnswers: SecurityAnswer[] = [];

        for (const ans of answers) {
            const securityAnswer = this.securityAnswerRepository.create({
                user_id: userId,
                question_id: ans.questionId,
                answer: ans.answer,
            });
            savedAnswers.push(await this.securityAnswerRepository.save(securityAnswer));
        }

        return savedAnswers;
    }

    // Payment Methods
    // async addPaymentMethod(
    //   userId: string,
    //   paymentMethod: Partial<PaymentMethods>
    // ): Promise<PaymentMethods> {
    //   const newPaymentMethod = this.paymentMethodRepository.create({
    //     ...paymentMethod,
    //     userId: userId,
    //   });
    //   return this.paymentMethodRepository.save(newPaymentMethod);
    // }

    // User Status
    async toggleOnlineStatus(id: string, isOnline: boolean): Promise<User> {
        const user = await this.getOne({where: {id}});
        user.status.isOnline = isOnline;
        return this.userRepository.save(user);
    }

    async suspendUser(id: string, suspended: boolean): Promise<User> {
        const user = await this.getOne({where: {id}});
        user.status.isSuspended = suspended;
        return this.userRepository.save(user);
    }

    // Advanced Queries
    async findBySecurityAnswer(questionId: string, answer: string): Promise<User | undefined> {
        const result = await this.userRepository
            .createQueryBuilder('user')
            .innerJoin('user.securityAnswers', 'answer')
            .where('answer.question_id = :questionId', {questionId})
            .andWhere('answer.answer = :answer', {answer})
            .getOne();
        return result || undefined;
    }

    async getUserWithFullProfile(id: string): Promise<User> {
        const result = await this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.setting', 'setting')
            .leftJoinAndSelect('user.address', 'address')
            .leftJoinAndSelect('user.securityAnswers', 'securityAnswers')
            .leftJoinAndSelect('securityAnswers.question', 'question')
            .where('user.id = :id', {id})
            .getOne();
        if (!result) {
            throw new NotFoundException(`There isn't any user with id: ${id}`);
        }
        return result;
    }

    async suspendAccount(userId: string): Promise<User> {
        const user = await this.getOne({where: {id: userId}});
        user.status.isSuspended = true;
        return this.userRepository.save(user);
    }

    async unsuspendAccount(userId: string): Promise<User> {
        const user = await this.getOne({where: {id: userId}});
        user.status.isSuspended = false;
        return this.userRepository.save(user);
    }

    async deleteAccount(userId: string): Promise<void> {
        const user = await this.getOne({where: {id: userId}});
        // Mark as deleted instead of actually deleting
        user.status.isDeleted = true;
        await this.userRepository.save(user);

        // Publish user deleted event
        await this.userEventsService.publishUserDeleted({
            id: userId,
        });
    }

    async updateProfilePrivacy(userId: string, privacy: ProfilePrivacy): Promise<User> {
        const user = await this.getOne({where: {id: userId}});
        user.profilePrivacy = privacy;
        return this.userRepository.save(user);
    }

    // New method to trigger a manual sync of all users
    async syncAllUsers(): Promise<void> {
        const users = await this.userRepository.find({
            select: ['id', 'username', 'email', 'firstName', 'lastName', 'profileImageUrl'],
        });

        const userDataForSync = users.map((user) => ({
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
        }));

        await this.userEventsService.triggerUserSync(userDataForSync);
    }

    async getUserBiography(userId: string): Promise<string> {
        const user = await this.getOne({where: {id: userId}});
        if (!user) {
            throw new NotFoundException(`There isn't any user with id: ${userId}`);
        }
        return user.biography || 'No biography available';
    }

    async updateBiography(userId: string, biography: string): Promise<User> {
        const user = await this.getOne({where: {id: userId}});
        if (!user) {
            throw new NotFoundException(`There isn't any user with id: ${userId}`);
        }
        user.biography = biography;
        return this.userRepository.save(user);
    }

    async getUserEvents(userId: string): Promise<string[]> {
        const user = await this.getOne({where: {id: userId}});
        if (!user) {
            throw new NotFoundException(`There isn't any user with id: ${userId}`);
        }
        return user.userEvent || [];
    }

    async addUserEvent(userId: string, event: string[]): Promise<User> {
        const user = await this.getOne({where: {id: userId}});
        if (!user) {
            throw new NotFoundException(`There isn't any user with id: ${userId}`);
        }
        user.userEvent = [...(user.userEvent || []), ...event];
        return this.userRepository.save(user);
    }

    async removeUserEvent(userId: string, event: string[]): Promise<User> {
        const user = await this.getOne({where: {id: userId}});
        if (!user) {
            throw new NotFoundException(`There isn't any user with id: ${userId}`);
        }
        user.userEvent = (user.userEvent || []).filter((e) => !event.includes(e));

        return this.userRepository.save(user);
    }
}

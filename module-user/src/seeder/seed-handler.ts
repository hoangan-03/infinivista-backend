import {faker} from '@faker-js/faker';
import {Controller, Logger} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {Friend} from '@/entities/local/friend.entity';
import {FriendRequest} from '@/entities/local/friend-request.entity';
import {PaymentMethods} from '@/entities/local/payment-methods.entity';
import {SecurityAnswer} from '@/entities/local/security-answer.entity';
import {SecurityQuestion} from '@/entities/local/security-question.entity';
import {Setting} from '@/entities/local/setting.entity';
import {User} from '@/entities/local/user.entity';
import {UserStatus} from '@/entities/local/user-status.entity';
import {FriendStatus} from '@/modules/user/enums/friend-status.enum';
import {Gender} from '@/modules/user/enums/gender.enum';
import {PaymentMethodType} from '@/modules/user/enums/payment-method.enum';
import {ProfilePrivacy} from '@/modules/user/enums/profile-privacy.enum';
import {SettingType} from '@/modules/user/enums/setting.enum';
import {hashPassword} from '@/utils/hash-password';

@Controller()
export class SeedHandlerController {
    private readonly logger = new Logger(SeedHandlerController.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(UserStatus)
        private readonly userStatusRepository: Repository<UserStatus>,
        @InjectRepository(Setting)
        private readonly settingRepository: Repository<Setting>,
        @InjectRepository(SecurityQuestion)
        private readonly securityQuestionRepository: Repository<SecurityQuestion>,
        @InjectRepository(SecurityAnswer)
        private readonly securityAnswerRepository: Repository<SecurityAnswer>,
        @InjectRepository(Friend)
        private readonly friendRepository: Repository<Friend>,
        @InjectRepository(FriendRequest)
        private readonly friendRequestRepository: Repository<FriendRequest>,
        @InjectRepository(PaymentMethods)
        private readonly paymentMethodsRepository: Repository<PaymentMethods>
    ) {}

    @MessagePattern('USER_SEED_QUEUE')
    async seedUsers(payload: {command: 'seed'; count: number}): Promise<void> {
        if (payload.command !== 'seed') return;

        this.logger.log(`Seeding ${payload.count} users`);

        // Clear existing data in reverse dependency order
        await this.friendRequestRepository.clear();
        await this.friendRepository.clear();
        await this.securityAnswerRepository.clear();
        await this.paymentMethodsRepository.clear();
        await this.settingRepository.clear();
        await this.userStatusRepository.clear();
        await this.userRepository.clear();
        await this.securityQuestionRepository.clear();

        // Create security questions
        const securityQuestions = await this.createSecurityQuestions();

        // Create users with related entities
        const users = [];
        for (let i = 0; i < payload.count; i++) {
            const user = await this.createUser(i, securityQuestions);
            users.push(user);
        }

        // Create friend relationships and requests
        await this.createFriendships(users);

        this.logger.log(`Seeding complete - ${users.length} users created`);
    }

    @MessagePattern('USER_EXPORT_QUEUE')
    async exportUsers(): Promise<User[]> {
        return this.userRepository.find();
    }

    private async createSecurityQuestions(): Promise<SecurityQuestion[]> {
        const questions = [
            "What was your first pet's name?",
            "What is your mother's maiden name?",
            'In which city were you born?',
            'What was the name of your first school?',
            'What is your favorite movie?',
        ];

        const securityQuestions = [];
        for (const question of questions) {
            const securityQuestion = this.securityQuestionRepository.create({
                question,
            });
            await this.securityQuestionRepository.save(securityQuestion);
            securityQuestions.push(securityQuestion);
        }

        return securityQuestions;
    }

    private async createUser(index: number, securityQuestions: SecurityQuestion[]): Promise<User> {
        // Create base user
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const username = index === 0 ? 'admin' : `user${index}`;

        const user = this.userRepository.create({
            email: index === 0 ? 'admin@example.com' : `${username}@example.com`,
            username,
            password: await hashPassword('password123'),
            firstName,
            lastName,
            phoneNumber: faker.phone.number(),
            dob: faker.date.birthdate({years: 18, mode: 'age'}),
            gender: faker.helpers.arrayElement(Object.values(Gender)),
            profileImageUrl: faker.image.avatar(),
            coverImageUrl: faker.image.url(),
            address: faker.location.streetAddress(),
            profilePrivacy: faker.helpers.arrayElement(Object.values(ProfilePrivacy)),
        });

        await this.userRepository.save(user);

        // Create user status
        const userStatus = this.userStatusRepository.create({
            user_id: user.id,
            isOnline: faker.datatype.boolean(),
            isSuspended: false,
            isDeleted: false,
        });
        await this.userStatusRepository.save(userStatus);

        // Create user settings
        const settingValues = [
            {type: SettingType.NOTIFICATION, value: faker.datatype.boolean().toString()},
            {type: SettingType.ACCOUNT_PRIVACY, value: faker.helpers.arrayElement(['public', 'private', 'friends'])},
            {type: SettingType.LANGUAGE, value: faker.helpers.arrayElement(['en', 'fr', 'es', 'de'])},
            {type: SettingType.THEME, value: faker.helpers.arrayElement(['light', 'dark'])},
        ];

        for (const setting of settingValues) {
            const userSetting = this.settingRepository.create({
                user_id: user.id,
                type: setting.type,
                value: setting.value,
            });
            await this.settingRepository.save(userSetting);
        }

        // Create security answers (3 random questions)
        const randomQuestions = faker.helpers.arrayElements(securityQuestions, 3);
        for (const question of randomQuestions) {
            const securityAnswer = this.securityAnswerRepository.create({
                user_id: user.id,
                question_id: question.id,
                answer: faker.lorem.word(),
            });
            await this.securityAnswerRepository.save(securityAnswer);
        }

        // Create payment methods (1-2 per user)
        const paymentMethodsCount = faker.number.int({min: 1, max: 2});
        for (let i = 0; i < paymentMethodsCount; i++) {
            const paymentMethod = this.paymentMethodsRepository.create({
                user_id: user.id,
                payment_method: faker.helpers.arrayElement(Object.values(PaymentMethodType)),
                card_last_four: faker.finance.creditCardNumber('####'),
                payment_token: `tok_${faker.string.alphanumeric(10)}`,
                card_expiration_date: `${faker.date.future().getMonth() + 1}/${faker.date.future().getFullYear().toString().slice(-2)}`,
            });
            await this.paymentMethodsRepository.save(paymentMethod);
        }

        return user;
    }

    private async createFriendships(users: User[]): Promise<void> {
        // Create some friend relationships (each user is friends with ~3 others)
        for (const user of users) {
            const otherUsers = users.filter((u) => u.id !== user.id);
            const friendsCount = Math.min(otherUsers.length, 3);
            const friends = faker.helpers.arrayElements(otherUsers, friendsCount);

            for (const friend of friends) {
                // Check if friendship already exists in either direction
                const existingFriendship = await this.friendRepository.findOne({
                    where: [
                        {user_id: user.id, friend_id: friend.id},
                        {user_id: friend.id, friend_id: user.id},
                    ],
                });

                if (!existingFriendship) {
                    const friendship = this.friendRepository.create({
                        user_id: user.id,
                        friend_id: friend.id,
                        group: faker.helpers.arrayElement(['Close Friends', 'Family', 'Work', null]),
                    });
                    await this.friendRepository.save(friendship);

                    // Create the reverse friendship too
                    const reverseFriendship = this.friendRepository.create({
                        user_id: friend.id,
                        friend_id: user.id,
                        group: faker.helpers.arrayElement(['Close Friends', 'Family', 'Work', null]),
                    });
                    await this.friendRepository.save(reverseFriendship);
                }
            }

            // Create some pending friend requests
            const nonFriends = otherUsers.filter((u) => !friends.includes(u));
            if (nonFriends.length > 0) {
                const requestCount = Math.min(nonFriends.length, 2);
                const requestUsers = faker.helpers.arrayElements(nonFriends, requestCount);

                for (const requestUser of requestUsers) {
                    const friendRequest = this.friendRequestRepository.create({
                        sender_id: user.id,
                        recipient_id: requestUser.id,
                        status: FriendStatus.PENDING,
                    });
                    await this.friendRequestRepository.save(friendRequest);
                }
            }
        }
    }
}

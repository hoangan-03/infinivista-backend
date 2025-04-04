import {faker} from '@faker-js/faker';
import {Controller, Logger} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';
import {InjectRepository} from '@nestjs/typeorm';
import * as amqp from 'amqplib';
import * as fs from 'fs';
import * as path from 'path';
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

// For direct file logging bypassing any logger configuration issues
function directLog(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    console.log(logMessage);

    // Also log to file for persistent debugging
    const logDir = path.join(__dirname, '..', '..', 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, {recursive: true});
    }

    fs.appendFileSync(path.join(logDir, 'user-seeder.log'), logMessage);
}

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
    ) {
        console.log('==========================================');
        console.log('SeedHandlerController INSTANTIATED');
        console.log('==========================================');

        directLog('SeedHandlerController instantiated');
        this.logger.log('SeedHandlerController instantiated');
    }

    @MessagePattern('USER_SEED_QUEUE')
    async seedUsers(payload: {command: 'seed'; count: number}): Promise<void> {
        try {
            directLog(`USER_SEED_QUEUE received: ${JSON.stringify(payload)}`);
            console.log('==========================================');
            console.log('USER_SEED_QUEUE RECEIVED:', payload);
            console.log('==========================================');

            if (!payload || payload.command !== 'seed') {
                directLog(`Invalid payload received: ${JSON.stringify(payload)}`);
                this.logger.warn(`Invalid command received: ${JSON.stringify(payload)}`);
                return;
            }

            directLog(`Seeding ${payload.count} users`);
            this.logger.log(`Seeding ${payload.count} users`);

            try {
                // Clear existing data in reverse dependency order
                directLog('Clearing existing data...');
                this.logger.log('Clearing existing data...');

                await this.friendRequestRepository.clear();
                await this.friendRepository.clear();
                await this.securityAnswerRepository.clear();
                await this.paymentMethodsRepository.clear();
                await this.settingRepository.clear();
                await this.userStatusRepository.clear();
                await this.userRepository.clear();
                await this.securityQuestionRepository.clear();

                directLog('Data cleared successfully');
                this.logger.log('Data cleared successfully');
            } catch (error: any) {
                const errorMsg = `Error clearing data: ${error.message}`;
                directLog(errorMsg);
                console.error('ERROR CLEARING DATA:', error);
                this.logger.error(errorMsg);
                this.logger.error(error.stack);
                throw error;
            }

            // Create security questions
            let securityQuestions: SecurityQuestion[];
            try {
                directLog('Creating security questions...');
                this.logger.log('Creating security questions...');
                securityQuestions = await this.createSecurityQuestions();
                directLog(`Created ${securityQuestions.length} security questions`);
                this.logger.log(`Created ${securityQuestions.length} security questions`);
            } catch (error: any) {
                const errorMsg = `Error creating security questions: ${error.message}`;
                directLog(errorMsg);
                console.error('ERROR CREATING SECURITY QUESTIONS:', error);
                this.logger.error(errorMsg);
                this.logger.error(error.stack);
                throw error;
            }

            // Create users with related entities
            const users: User[] = [];
            try {
                directLog(`Creating ${payload.count} users...`);
                this.logger.log(`Creating ${payload.count} users...`);

                for (let i = 0; i < payload.count; i++) {
                    try {
                        directLog(`Creating user ${i + 1}/${payload.count}`);
                        const user = await this.createUser(i, securityQuestions);
                        users.push(user);
                        directLog(`Created user ${i + 1}/${payload.count}: ${user.username} (${user.id})`);
                    } catch (userError: any) {
                        const errorMsg = `Error creating user ${i + 1}: ${userError.message}`;
                        directLog(errorMsg);
                        console.error(errorMsg, userError);
                        this.logger.error(errorMsg);
                        this.logger.error(userError.stack);
                        // Continue with next user
                    }
                }
                directLog(`Created ${users.length} users`);
                this.logger.log(`Created ${users.length} users`);
            } catch (error: any) {
                const errorMsg = `Error creating users: ${error.message}`;
                directLog(errorMsg);
                console.error('ERROR CREATING USERS:', error);
                this.logger.error(errorMsg);
                this.logger.error(error.stack);
                throw error;
            }

            // Create friend relationships and requests
            try {
                directLog('Creating friendships...');
                this.logger.log('Creating friendships...');
                await this.createFriendships(users);
                directLog('Friendships created successfully');
                this.logger.log('Friendships created successfully');
            } catch (error: any) {
                const errorMsg = `Error creating friendships: ${error.message}`;
                directLog(errorMsg);
                console.error('ERROR CREATING FRIENDSHIPS:', error);
                this.logger.error(errorMsg);
                this.logger.error(error.stack);
                throw error;
            }

            const completionMsg = `Seeding complete - ${users.length} users created`;
            directLog(completionMsg);
            this.logger.log(completionMsg);
            console.log('==========================================');
            console.log(completionMsg);
            console.log('==========================================');
        } catch (error: any) {
            const errorMsg = `Fatal error in seedUsers: ${error.message}`;
            directLog(errorMsg);
            console.error('FATAL ERROR IN SEED USERS:', error);
            this.logger.error(errorMsg);
            this.logger.error(error.stack);
            throw error;
        }
    }

    @MessagePattern('USER_EXPORT_QUEUE')
    async exportUsers(): Promise<void> {
        try {
            directLog('USER_EXPORT_QUEUE received');
            console.log('==========================================');
            console.log('USER_EXPORT_QUEUE RECEIVED');
            console.log('==========================================');
            this.logger.log('USER_EXPORT_QUEUE received');
            this.logger.log('Exporting users for seeding other modules');

            // Get users with limited fields for reference
            let users: User[];
            try {
                users = await this.userRepository.find({
                    select: ['id', 'username', 'firstName', 'lastName', 'email', 'profileImageUrl'],
                });
                directLog(`Found ${users.length} users to export`);
                this.logger.log(`Found ${users.length} users to export`);
            } catch (error: any) {
                const errorMsg = `Error finding users: ${error.message}`;
                directLog(errorMsg);
                console.error('ERROR FINDING USERS:', error);
                this.logger.error(errorMsg);
                this.logger.error(error.stack);
                throw error;
            }

            // Create a direct connection to publish result back
            try {
                const rabbitHost = process.env.RABBITMQ_HOST_NAME || 'localhost';
                const rabbitPort = process.env.RABBITMQ_PORT || '5675';

                directLog(`Connecting to RabbitMQ at ${rabbitHost}:${rabbitPort}`);
                this.logger.log(`Connecting to RabbitMQ at ${rabbitHost}:${rabbitPort}`);

                const connection = await amqp.connect(`amqp://${rabbitHost}:${rabbitPort}`);
                const channel = await connection.createChannel();

                directLog('Connected to RabbitMQ');
                this.logger.log('Connected to RabbitMQ');

                // Create the result queue and send the users
                await channel.assertQueue('USER_EXPORT_RESULT', {durable: false});
                directLog('USER_EXPORT_RESULT queue created');
                this.logger.log('USER_EXPORT_RESULT queue created');

                channel.sendToQueue('USER_EXPORT_RESULT', Buffer.from(JSON.stringify(users)));
                const exportMsg = `Exported ${users.length} users to USER_EXPORT_RESULT queue`;
                directLog(exportMsg);
                this.logger.log(exportMsg);
                console.log('==========================================');
                console.log(exportMsg);
                console.log('==========================================');

                // Close connection
                await channel.close();
                await connection.close();
                directLog('RabbitMQ connection closed');
                this.logger.log('RabbitMQ connection closed');
            } catch (error: any) {
                const errorMsg = `Error publishing to RabbitMQ: ${error.message}`;
                directLog(errorMsg);
                console.error('ERROR PUBLISHING TO RABBITMQ:', error);
                this.logger.error(errorMsg);
                this.logger.error(error.stack);
                throw error;
            }
        } catch (error: any) {
            const errorMsg = `Fatal error in exportUsers: ${error.message}`;
            directLog(errorMsg);
            console.error('FATAL ERROR IN EXPORT USERS:', error);
            this.logger.error(errorMsg);
            this.logger.error(error.stack);
            throw error;
        }
    }

    private async createSecurityQuestions(): Promise<SecurityQuestion[]> {
        try {
            const questions = [
                "What was your first pet's name?",
                "What is your mother's maiden name?",
                'In which city were you born?',
                'What was the name of your first school?',
                'What is your favorite movie?',
            ];

            const securityQuestions: SecurityQuestion[] = [];
            for (const question of questions) {
                const securityQuestion = this.securityQuestionRepository.create({
                    question,
                });
                await this.securityQuestionRepository.save(securityQuestion);
                securityQuestions.push(securityQuestion);
            }

            return securityQuestions;
        } catch (error: any) {
            directLog(`Error in createSecurityQuestions: ${error.message}`);
            this.logger.error(`Error in createSecurityQuestions: ${error.message}`);
            throw error;
        }
    }

    private async createUser(index: number, securityQuestions: SecurityQuestion[]): Promise<User> {
        try {
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
                dob: faker.date.birthdate({mode: 'age', min: 18, max: 24}),
                gender: faker.helpers.arrayElement(Object.values(Gender)),
                profileImageUrl: faker.image.avatar(),
                coverImageUrl: faker.image.url(),
                address: faker.location.streetAddress(),
                profilePrivacy: faker.helpers.arrayElement(Object.values(ProfilePrivacy)),
            });

            await this.userRepository.save(user);
            directLog(`Created base user: ${username}`);

            try {
                // Create user status
                const userStatus = this.userStatusRepository.create({
                    user_id: user.id,
                    isOnline: faker.datatype.boolean(),
                    isSuspended: false,
                    isDeleted: false,
                });
                await this.userStatusRepository.save(userStatus);
                directLog(`Created status for user: ${username}`);
            } catch (error: any) {
                directLog(`Error creating user status for ${username}: ${error.message}`);
                this.logger.error(`Error creating user status for ${username}: ${error.message}`);
                // Continue anyway
            }

            try {
                // Create user settings
                const settingValues = [
                    {type: SettingType.NOTIFICATION, value: faker.datatype.boolean().toString()},
                    {
                        type: SettingType.POST_PRIVACY,
                        value: faker.helpers.arrayElement(['PUBLIC', 'PRIVATE', 'FRIENDS']),
                    },
                    {
                        type: SettingType.ACCOUNT_PRIVACY,
                        value: faker.helpers.arrayElement(['PUBLIC', 'PRIVATE', 'FRIENDS']),
                    },
                    {type: SettingType.LANGUAGE, value: faker.helpers.arrayElement(['ENGLISH', 'VIETNAMESE'])},
                    {type: SettingType.THEME, value: faker.helpers.arrayElement(['LIGHT', 'DARK'])},
                ];

                for (const setting of settingValues) {
                    const userSetting = this.settingRepository.create({
                        user_id: user.id,
                        type: setting.type,
                        value: setting.value,
                    });
                    await this.settingRepository.save(userSetting);
                }
                directLog(`Created settings for user: ${username}`);
            } catch (error: any) {
                directLog(`Error creating settings for ${username}: ${error.message}`);
                this.logger.error(`Error creating settings for ${username}: ${error.message}`);
                // Continue anyway
            }

            try {
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
                directLog(`Created security answers for user: ${username}`);
            } catch (error: any) {
                directLog(`Error creating security answers for ${username}: ${error.message}`);
                this.logger.error(`Error creating security answers for ${username}: ${error.message}`);
                // Continue anyway
            }

            try {
                // Create payment methods (1-2 per user)
                const paymentMethodsCount = faker.number.int({min: 1, max: 2});
                for (let i = 0; i < paymentMethodsCount; i++) {
                    const paymentMethod = this.paymentMethodsRepository.create({
                        id: user.id,
                        payment_method: faker.helpers.arrayElement(Object.values(PaymentMethodType)),
                        card_last_four: faker.finance.creditCardNumber('####'),
                        payment_token: `tok_${faker.string.alphanumeric(10)}`,
                        card_expiration_date: `${faker.date.future().getMonth() + 1}/${faker.date.future().getFullYear().toString().slice(-2)}`,
                    });
                    await this.paymentMethodsRepository.save(paymentMethod);
                }
                directLog(`Created payment methods for user: ${username}`);
            } catch (error: any) {
                directLog(`Error creating payment methods for ${username}: ${error.message}`);
                this.logger.error(`Error creating payment methods for ${username}: ${error.message}`);
                // Continue anyway
            }

            return user;
        } catch (error: any) {
            directLog(`Error in createUser for index ${index}: ${error.message}`);
            this.logger.error(`Error in createUser for index ${index}: ${error.message}`);
            throw error;
        }
    }

    private async createFriendships(users: User[]): Promise<void> {
        try {
            // Create some friend relationships (each user is friends with ~3 others)
            for (const user of users) {
                try {
                    const otherUsers = users.filter((u) => u.id !== user.id);
                    const friendsCount = Math.min(otherUsers.length, 3);
                    const friends = faker.helpers.arrayElements(otherUsers, friendsCount);

                    for (const friend of friends) {
                        try {
                            // Check if friendship already exists in either direction
                            const existingFriendship = await this.friendRepository.findOne({
                                where: [
                                    {user: user, friend: friend},
                                    {user: friend, friend: user},
                                ],
                            });

                            if (!existingFriendship) {
                                const friendship = this.friendRepository.create({
                                    user: user,
                                    friend: friend,
                                });
                                await this.friendRepository.save(friendship);

                                // Create the reverse friendship too
                                const reverseFriendship = this.friendRepository.create({
                                    user: friend,
                                    friend: user,
                                });
                                await this.friendRepository.save(reverseFriendship);
                                directLog(`Created friendship between ${user.username} and ${friend.username}`);
                            }
                        } catch (friendError: any) {
                            directLog(`Error creating friendship for ${user.username}: ${friendError.message}`);
                            this.logger.error(`Error creating friendship for ${user.username}: ${friendError.message}`);
                            // Continue with next friend
                        }
                    }

                    // Create some pending friend requests
                    try {
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
                                directLog(`Created friend request from ${user.username} to ${requestUser.username}`);
                            }
                        }
                    } catch (requestError: any) {
                        directLog(`Error creating friend requests for ${user.username}: ${requestError.message}`);
                        this.logger.error(
                            `Error creating friend requests for ${user.username}: ${requestError.message}`
                        );
                        // Continue with next user
                    }
                } catch (userError: any) {
                    directLog(`Error processing friendships for user ${user.username}: ${userError.message}`);
                    this.logger.error(`Error processing friendships for user ${user.username}: ${userError.message}`);
                    // Continue with next user
                }
            }
        } catch (error: any) {
            directLog(`Error in createFriendships: ${error.message}`);
            this.logger.error(`Error in createFriendships: ${error.message}`);
            throw error;
        }
    }
}

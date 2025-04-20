import {faker} from '@faker-js/faker';
import {Logger} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {DataSource} from 'typeorm';

import {AppModule} from '../app.module';
import {Friend} from '../entities/local/friend.entity';
import {FriendRequest} from '../entities/local/friend-request.entity';
import {SecurityAnswer} from '../entities/local/security-answer.entity';
import {SecurityQuestion} from '../entities/local/security-question.entity';
import {Setting} from '../entities/local/setting.entity';
import {User} from '../entities/local/user.entity';
import {UserStatus} from '../entities/local/user-status.entity';
import {FriendStatus} from '../modules/user/enums/friend-status.enum';
import {Gender} from '../modules/user/enums/gender.enum';
import {ProfilePrivacy} from '../modules/user/enums/profile-privacy.enum';
import {SettingType} from '../modules/user/enums/setting.enum';
import {hashPassword} from '../utils/hash-password';

export const seedUserDatabase = async (dataSource: DataSource) => {
    const app = await NestFactory.createApplicationContext(AppModule);
    const logger = new Logger('UserSeeder');

    try {
        logger.log('Starting user module seeding...');

        // Get repositories
        const userRepo = dataSource.getRepository(User);
        const userStatusRepo = dataSource.getRepository(UserStatus);
        const settingRepo = dataSource.getRepository(Setting);
        const friendRepo = dataSource.getRepository(Friend);
        const friendRequestRepo = dataSource.getRepository(FriendRequest);
        const securityQuestionRepo = dataSource.getRepository(SecurityQuestion);
        const securityAnswerRepo = dataSource.getRepository(SecurityAnswer);

        // Check for existing data
        logger.log('Checking for existing data...');

        logger.log('Clearing existing data...');
        await friendRequestRepo.query('TRUNCATE TABLE friend_requests CASCADE;');
        await friendRepo.query('TRUNCATE TABLE friends CASCADE;');

        await settingRepo.query('TRUNCATE TABLE settings CASCADE;');
        await userStatusRepo.query('TRUNCATE TABLE user_status CASCADE;');
        // Clear parent tables last
        await securityQuestionRepo.query('TRUNCATE TABLE security_questions CASCADE;');
        await securityAnswerRepo.query('TRUNCATE TABLE security_answers CASCADE;');
        await userRepo.query('TRUNCATE TABLE users CASCADE;');

        // Create or get security questions
        logger.log('Creating security questions...');
        const questionTexts = [
            "What was your first pet's name?",
            "What is your mother's maiden name?",
            'In which city were you born?',
            'What was the name of your first school?',
            'What is your favorite movie?',
            'What street did you grow up on?',
            'What was your first car?',
            'What is your favorite book?',
            'Who was your childhood hero?',
            'What is your favorite vacation destination?',
        ];

        const securityQuestions: SecurityQuestion[] = [];
        for (const questionText of questionTexts) {
            // Check if question already exists
            let question = await securityQuestionRepo.findOne({
                where: {question: questionText},
            });

            if (!question) {
                question = securityQuestionRepo.create({question: questionText});
                await securityQuestionRepo.save(question);
                logger.log(`Created security question: "${questionText}"`);
            } else {
                logger.log(`Found existing security question: "${questionText}"`);
            }
            securityQuestions.push(question);
        }

        logger.log('Creating users...');
        const users: User[] = [];

        // Admin user
        try {
            logger.log('Creating admin user...');
            const adminUser = userRepo.create({
                email: 'admin@example.com',
                username: 'admin',
                password: await hashPassword('password123'),
                firstName: 'Admin',
                lastName: 'User',
                phoneNumber: faker.phone.number({style: 'international'}),
                dob: faker.date.birthdate({min: 25, max: 40, mode: 'age'}),
                gender: Gender.OTHER,
                profileImageUrl: faker.image.avatar(),
                coverImageUrl: faker.image.url(),
                address: faker.location.streetAddress(),
                profilePrivacy: ProfilePrivacy.PUBLIC,
            });
            await userRepo.save(adminUser);
            users.push(adminUser);
            logger.log('Admin user created successfully');
        } catch (error: any) {
            logger.error(`Error creating admin user: ${error.message}`);
            logger.error(error.stack);
            throw error; // Rethrow to stop the process
        }

        // Regular users - Increased to 30 regular users
        const numberOfRegularUsers = 30;
        for (let i = 1; i <= numberOfRegularUsers; i++) {
            try {
                const firstName = faker.person.firstName();
                const lastName = faker.person.lastName();
                logger.log(`Creating user${i} (${i}/${numberOfRegularUsers}): ${firstName} ${lastName}...`);

                const user = userRepo.create({
                    email: `user${i}@example.com`,
                    username: `user${i}`,
                    password: await hashPassword('password123'),
                    firstName,
                    lastName,
                    phoneNumber: faker.phone.number({style: 'international'}),
                    dob: faker.date.birthdate({min: 18, max: 70, mode: 'age'}),
                    gender: faker.helpers.arrayElement(Object.values(Gender)),
                    profileImageUrl: faker.image.avatar(),
                    coverImageUrl: faker.image.url(),
                    address: faker.location.streetAddress(),
                    profilePrivacy: faker.helpers.arrayElement(Object.values(ProfilePrivacy)),
                });
                await userRepo.save(user);
                users.push(user);
                logger.log(`User user${i} created successfully`);
            } catch (error: any) {
                logger.error(`Error creating user${i}: ${error.message}`);
                logger.error(error.stack);
                throw error; // Rethrow to stop the process
            }
        }

        // Create user status for each user
        logger.log('Creating user statuses...');
        for (const user of users) {
            try {
                const userStatus = userStatusRepo.create({
                    user_id: user.id,
                    isOnline: faker.datatype.boolean(),
                    isSuspended: faker.helpers.maybe(() => true, {probability: 0.05}), // 5% chance of being suspended
                    isDeleted: faker.helpers.maybe(() => true, {probability: 0.02}), // 2% chance of being deleted
                });
                await userStatusRepo.save(userStatus);
                logger.log(`Created status for user: ${user.username}`);
            } catch (error: any) {
                logger.error(`Error creating user status for ${user.username}: ${error.message}`);
                logger.error(error.stack);
                throw error;
            }
        }

        // Create settings for each user
        logger.log('Creating user settings...');
        for (const user of users) {
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
                {
                    type: SettingType.LANGUAGE,
                    value: faker.helpers.arrayElement(['ENGLISH', 'VIETNAMESE', 'SPANISH', 'FRENCH', 'GERMAN']),
                },
                {type: SettingType.THEME, value: faker.helpers.arrayElement(['LIGHT', 'DARK', 'SYSTEM'])},
            ];

            try {
                for (const setting of settingValues) {
                    const userSetting = settingRepo.create({
                        user_id: user.id,
                        type: setting.type,
                        value: setting.value,
                    });
                    await settingRepo.save(userSetting);
                }
                logger.log(`Created settings for user: ${user.username}`);
            } catch (error: any) {
                logger.error(`Error creating settings for ${user.username}: ${error.message}`);
                logger.error(error.stack);
                throw error;
            }
        }

        // Create security answers
        logger.log('Creating security answers...');
        for (const user of users) {
            try {
                // Each user answers 3 random questions
                const randomQuestions = faker.helpers.arrayElements(securityQuestions, 3);
                for (const question of randomQuestions) {
                    const securityAnswer = securityAnswerRepo.create({
                        user_id: user.id,
                        question_id: question.id,
                        answer: faker.lorem.word(),
                    });
                    await securityAnswerRepo.save(securityAnswer);
                }
                logger.log(`Created security answers for user: ${user.username}`);
            } catch (error: any) {
                logger.error(`Error creating security answers for ${user.username}: ${error.message}`);
                logger.error(error.stack);
                throw error;
            }
        }

        // Create payment methods
        logger.log('Creating payment methods...');

        // Create friendship connections (much more than before)
        logger.log('Creating friendships...');
        try {
            // Regular users excluding admin (first user)
            const regularUsers = users.slice(1);

            // Each user will have 3-10 friends
            for (let i = 0; i < regularUsers.length; i++) {
                const user = regularUsers[i];

                // Determine number of friends for this user (3-10)
                const numFriends = faker.number.int({min: 3, max: 10});

                // Get potential friends (users that aren't the current user)
                const potentialFriends = regularUsers.filter((u) => u.id !== user.id);

                // Select random friends up to numFriends or max available
                const selectedFriends = faker.helpers.arrayElements(
                    potentialFriends,
                    Math.min(numFriends, potentialFriends.length)
                );

                // Create friendships
                for (const friend of selectedFriends) {
                    // Check if friendship already exists in either direction
                    const existingFriendship = await friendRepo.findOne({
                        where: [
                            {user_id: user.id, friend_id: friend.id},
                            {user_id: friend.id, friend_id: user.id},
                        ],
                    });

                    if (!existingFriendship) {
                        const friendship = friendRepo.create({
                            user_id: user.id,
                            friend_id: friend.id,
                        });
                        await friendRepo.save(friendship);
                        logger.log(`Created friendship between ${user.username} and ${friend.username}`);
                    }
                }
            }

            // Create friend requests (15-25 pending requests across all users)
            const numPendingRequests = faker.number.int({min: 15, max: 25});

            for (let i = 0; i < numPendingRequests; i++) {
                // Get random sender and recipient that aren't the same
                let sender, recipient;
                do {
                    sender = faker.helpers.arrayElement(users);
                    recipient = faker.helpers.arrayElement(regularUsers);
                } while (sender.id === recipient.id);

                // Check if friendship already exists
                const existingFriendship = await friendRepo.findOne({
                    where: [
                        {user_id: sender.id, friend_id: recipient.id},
                        {user_id: recipient.id, friend_id: sender.id},
                    ],
                });

                // Check if friend request already exists
                const existingRequest = await friendRequestRepo.findOne({
                    where: [
                        {sender_id: sender.id, recipient_id: recipient.id},
                        {sender_id: recipient.id, recipient_id: sender.id},
                    ],
                });

                // Only create if neither friendship nor request exists
                if (!existingFriendship && !existingRequest) {
                    const friendRequest = friendRequestRepo.create({
                        sender_id: sender.id,
                        recipient_id: recipient.id,
                        status: faker.helpers.arrayElement([
                            FriendStatus.PENDING,
                            FriendStatus.ACCEPTED,
                            FriendStatus.DECLINED,
                        ]),
                    });
                    await friendRequestRepo.save(friendRequest);
                    logger.log(`Created friend request from ${sender.username} to ${recipient.username}`);
                } else {
                    // Decrement counter to ensure we get the right number of requests
                    i--;
                }
            }
        } catch (error: any) {
            logger.error(`Error creating friendships: ${error.message}`);
            logger.error(error.stack);
            throw error;
        }

        logger.log('User module seeding completed successfully!');
    } catch (error: any) {
        logger.error(`Fatal error in seeding process: ${error.message}`);
        logger.error(error.stack);
        throw error; // Rethrow the error to signal failure
    } finally {
        await app.close();
    }
};

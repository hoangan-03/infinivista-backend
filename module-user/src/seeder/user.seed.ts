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
import {SocialLink} from '../entities/local/social-link.entity';
import {User} from '../entities/local/user.entity';
import {UserStatus} from '../entities/local/user-status.entity';
import {FriendStatus} from '../modules/user/enums/friend-status.enum';
import {Gender} from '../modules/user/enums/gender.enum';
import {ProfilePrivacy} from '../modules/user/enums/profile-privacy.enum';
import {SettingType} from '../modules/user/enums/setting.enum';
import {SocialLinkType} from '../modules/user/enums/social-link.enum';
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
        const socialLinkRepo = dataSource.getRepository(SocialLink);

        // Check for existing data
        logger.log('Checking for existing data...');

        logger.log('Clearing existing data...');
        await friendRequestRepo.query('TRUNCATE TABLE friend_requests CASCADE;');
        await friendRepo.query('TRUNCATE TABLE friends CASCADE;');
        await socialLinkRepo.query('TRUNCATE TABLE social_links CASCADE;');
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
                biography:
                    'Official Infinivista administrator. I manage platform operations, user support, content moderation, and feature development. Follow me for official announcements, platform updates, and community guidelines.',
                userEvent: [
                    'Platform Launcher at Ohio State University',
                    'System Maintainer during Scheduled Downtime',
                    'Features Release Coordinator for New Updates',
                    'Community Guidelines Manager for Policy Update',
                    'User Support Host during Webinar Event',
                    'Admin Panel Updater for Backend Improvements',
                    'Survey Organizer for Annual User Feedback',
                    'Platform Growth Achiever at Milestone Event',
                    'Support Team Expansion Coordinator',
                ],
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

                // Generate user events for regular users (fewer than admin)
                const possibleEvents = [
                    'Profile Creator at Account Registration',
                    'First Post Publisher on Timeline',
                    'Friend Connector after New Friendship',
                    'Profile Updater during Account Modification',
                    'Birthday Celebration Host on User Anniversary',
                    'Achievement Unlocker for Special Recognition',
                    'Milestone Reacher at Platform Goals',
                    'Account Anniversary Celebrator',
                    'Profile Picture Updater for Visual Identity',
                    'Community Joiner in Social Groups',
                ];

                const userEvents = faker.helpers.arrayElements(possibleEvents, faker.number.int({min: 0, max: 4}));

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
                    biography: faker.lorem.paragraph(faker.number.int({min: 1, max: 3})),
                    userEvent: userEvents,
                });
                await userRepo.save(user);
                users.push(user);
                logger.log(`User user${i} created successfully with ${userEvents.length} events`);
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

        // Create social links
        logger.log('Creating social links...');

        // All social link types
        const socialLinkTypes = Object.values(SocialLinkType);

        // Create all types of social links for admin
        const adminUser = users[0];
        for (const linkType of socialLinkTypes) {
            try {
                const socialLink = socialLinkRepo.create({
                    user_id: adminUser.id,
                    type: linkType,
                    link: `https://${linkType === SocialLinkType.X ? 'twitter' : linkType.toLowerCase()}.com/infinivista_admin`,
                });
                await socialLinkRepo.save(socialLink);
            } catch (error: any) {
                logger.error(`Error creating social link for admin user: ${error.message}`);
            }
        }
        logger.log(`Created ${socialLinkTypes.length} social links for admin user`);

        // Create random social links for regular users
        for (const user of users.slice(1)) {
            // Regular users get 0-3 social links
            const linkCount = faker.number.int({min: 0, max: 3});
            const selectedTypes = faker.helpers.arrayElements(socialLinkTypes, linkCount);

            for (const linkType of selectedTypes) {
                try {
                    const username = user.username.toLowerCase();
                    const socialLink = socialLinkRepo.create({
                        user_id: user.id,
                        type: linkType,
                        link: `https://${linkType === SocialLinkType.X ? 'twitter' : linkType.toLowerCase()}.com/${username}`,
                    });
                    await socialLinkRepo.save(socialLink);
                } catch (error: any) {
                    logger.error(`Error creating social link for ${user.username}: ${error.message}`);
                }
            }
            if (linkCount > 0) {
                logger.log(`Created ${linkCount} social links for user: ${user.username}`);
            }
        }

        // Create friendship connections
        logger.log('Creating friendships...');
        try {
            const adminUser = users[0];
            // Regular users excluding admin
            const regularUsers = users.slice(1);

            // Make admin friends with 40-60% of all users
            const adminFriendCount = Math.floor(regularUsers.length * faker.number.float({min: 0.4, max: 0.6}));
            const adminFriends = faker.helpers.arrayElements(regularUsers, adminFriendCount);

            logger.log(`Creating ${adminFriendCount} friendships for admin user`);
            for (const friend of adminFriends) {
                const friendship = friendRepo.create({
                    user_id: adminUser.id,
                    friend_id: friend.id,
                });
                await friendRepo.save(friendship);
                logger.log(`Created friendship between admin and ${friend.username}`);
            }

            // Create additional friendships between regular users
            // Each user will have 3-10 friends
            for (let i = 0; i < regularUsers.length; i++) {
                const user = regularUsers[i];

                // Determine number of friends for this user (3-10)
                const numFriends = faker.number.int({min: 3, max: 10});

                // Get potential friends (users that aren't the current user and exclude those already friends with admin)
                const potentialFriends = regularUsers.filter(
                    (u) => u.id !== user.id && !adminFriends.some((af) => af.id === u.id)
                );

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

            // Create friend requests
            // - More requests to/from admin
            // - Regular requests between other users

            // First, create 10-15 friend requests specifically for admin
            const adminRequestCount = faker.number.int({min: 10, max: 15});
            logger.log(`Creating ${adminRequestCount} friend requests involving admin`);

            // Get users who aren't already friends with admin
            const nonAdminFriends = regularUsers.filter(
                (user) => !adminFriends.some((friend) => friend.id === user.id)
            );

            for (let i = 0; i < adminRequestCount && nonAdminFriends.length > 0; i++) {
                // Randomly decide if admin is sender or recipient
                const isAdminSender = faker.datatype.boolean();
                const regularUser = faker.helpers.arrayElement(nonAdminFriends);

                // Remove this user from potential future selections
                nonAdminFriends.splice(nonAdminFriends.indexOf(regularUser), 1);

                const sender_id = isAdminSender ? adminUser.id : regularUser.id;
                const recipient_id = isAdminSender ? regularUser.id : adminUser.id;

                const friendRequest = friendRequestRepo.create({
                    sender_id,
                    recipient_id,
                    status: faker.helpers.arrayElement([
                        FriendStatus.PENDING,
                        FriendStatus.ACCEPTED,
                        FriendStatus.DECLINED,
                    ]),
                });
                await friendRequestRepo.save(friendRequest);
                logger.log(
                    `Created friend request from ${isAdminSender ? 'admin' : regularUser.username} to ${isAdminSender ? regularUser.username : 'admin'}`
                );
            }

            // Then create regular requests between other users
            const numRegularPendingRequests = faker.number.int({min: 15, max: 25});

            for (let i = 0; i < numRegularPendingRequests; i++) {
                // Get random sender and recipient that aren't the same
                let sender, recipient;
                do {
                    sender = faker.helpers.arrayElement(regularUsers);
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

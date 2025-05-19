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
import {UserFollow} from '../entities/local/user-follow.entity';
import {UserStatus} from '../entities/local/user-status.entity';
import {FriendStatus} from '../modules/user/enums/friend-status.enum';
import {Gender} from '../modules/user/enums/gender.enum';
import {ProfilePrivacy} from '../modules/user/enums/profile-privacy.enum';
import {SettingType} from '../modules/user/enums/setting.enum';
import {SocialLinkType} from '../modules/user/enums/social-link.enum';
import {hashPassword} from '../utils/hash-password';

// Image links for seeding
const imageLinks = [
    'https://images.pexels.com/photos/1223649/pexels-photo-1223649.jpeg',
    'https://images.pexels.com/photos/1153369/pexels-photo-1153369.jpeg',
    'https://images.pexels.com/photos/1172253/pexels-photo-1172253.jpeg',
    'https://images.pexels.com/photos/57690/pexels-photo-57690.jpeg',
    'https://images.pexels.com/photos/62689/pexels-photo-62689.jpeg',
    'https://images.pexels.com/photos/237272/pexels-photo-237272.jpeg',
    'https://images.pexels.com/photos/1034940/pexels-photo-1034940.jpeg',
    'https://images.pexels.com/photos/610293/pexels-photo-610293.jpeg',
    'https://images.pexels.com/photos/1019771/pexels-photo-1019771.jpeg',
    'https://images.pexels.com/photos/1128318/pexels-photo-1128318.jpeg',
    // Add more if needed
];

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
        const userFollowRepo = dataSource.getRepository(UserFollow);

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
        await userFollowRepo.query('TRUNCATE TABLE user_follows CASCADE;');

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
                gender: Gender.MALE,
                profileImageUrl: faker.image.avatar(),
                coverImageUrl: faker.helpers.arrayElement(imageLinks),
                address: faker.location.streetAddress({useFullAddress: true}),
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

        // Second admin user
        try {
            logger.log('Creating second admin user...');
            const admin2User = userRepo.create({
                email: 'admin2@example.com',
                username: 'admin2',
                password: await hashPassword('password123'),
                firstName: 'Admin',
                lastName: 'Second',
                phoneNumber: faker.phone.number({style: 'international'}),
                dob: faker.date.birthdate({min: 28, max: 45, mode: 'age'}),
                gender: Gender.FEMALE,
                profileImageUrl: faker.image.avatar(),
                coverImageUrl: faker.helpers.arrayElement(imageLinks),
                address: faker.location.streetAddress({useFullAddress: true}),
                profilePrivacy: ProfilePrivacy.PUBLIC,
                biography:
                    'Second Infinivista administrator. I help with platform operations, content management, and community support. Follow me for platform updates and assistance.',
                userEvent: [
                    'Platform Co-administrator',
                    'Community Manager for East Region',
                    'Support Team Lead for Technical Issues',
                    'Content Moderation Expert',
                    'User Experience Researcher',
                    'Feature Testing Coordinator',
                    'User Engagement Specialist',
                ],
            });
            await userRepo.save(admin2User);
            users.push(admin2User);
            logger.log('Second admin user created successfully');
        } catch (error: any) {
            logger.error(`Error creating second admin user: ${error.message}`);
            logger.error(error.stack);
            throw error; // Rethrow to stop the process
        }

        // Create special content creators (5-6 users with recognizable names)
        logger.log('Creating special content creator users...');
        const contentCreators: User[] = [];
        const contentCreatorData = [
            {
                username: 'sarah_travels',
                firstName: 'Sarah',
                lastName: 'Johnson',
                email: 'sarah.johnson@example.com',
                biography:
                    'Travel photographer and digital nomad. Exploring the world one photo at a time. Currently in Southeast Asia.',
                gender: Gender.FEMALE,
            },
            {
                username: 'tech_mike',
                firstName: 'Mike',
                lastName: 'Chen',
                email: 'mike.chen@example.com',
                biography:
                    'Tech reviewer and software developer. I share insights about the latest gadgets and coding tips.',
                gender: Gender.MALE,
            },
            {
                username: 'fitness_alex',
                firstName: 'Alex',
                lastName: 'Rodriguez',
                email: 'alex.rodriguez@example.com',
                biography:
                    'Personal trainer and nutrition specialist. Helping you achieve your fitness goals with science-backed methods.',
                gender: Gender.MALE,
            },
            {
                username: 'chef_emily',
                firstName: 'Emily',
                lastName: 'Wong',
                email: 'emily.wong@example.com',
                biography:
                    'Professional chef and food blogger. I share recipes that are both delicious and approachable for home cooks.',
                gender: Gender.FEMALE,
            },
            {
                username: 'artist_james',
                firstName: 'James',
                lastName: 'Taylor',
                email: 'james.taylor@example.com',
                biography: 'Digital artist and illustrator. Creating worlds through pixels and imagination.',
                gender: Gender.MALE,
            },
            {
                username: 'news_lisa',
                firstName: 'Lisa',
                lastName: 'Garcia',
                email: 'lisa.garcia@example.com',
                biography: 'Journalist and commentator. Sharing breaking news and analysis on current events.',
                gender: Gender.FEMALE,
            },
        ];

        try {
            for (const creatorData of contentCreatorData) {
                logger.log(`Creating content creator: ${creatorData.username}...`);

                const contentCreator = userRepo.create({
                    email: creatorData.email,
                    username: creatorData.username,
                    password: await hashPassword('password123'),
                    firstName: creatorData.firstName,
                    lastName: creatorData.lastName,
                    phoneNumber: faker.phone.number({style: 'international'}),
                    dob: faker.date.birthdate({min: 25, max: 45, mode: 'age'}),
                    gender: creatorData.gender,
                    profileImageUrl: faker.image.avatar(),
                    coverImageUrl: faker.helpers.arrayElement(imageLinks),
                    address: faker.location.streetAddress({useFullAddress: true}),
                    profilePrivacy: ProfilePrivacy.PUBLIC, // All content creators are public
                    biography: creatorData.biography,
                    userEvent: faker.helpers.arrayElements(
                        [
                            'Content Creator Award Winner',
                            'Platform Featured Creator',
                            'Trending Post Achievement',
                            'Engagement Milestone Reacher',
                            'Community Spotlight Feature',
                            'Viral Content Producer',
                            'Top Contributor Highlight',
                            'Creative Excellence Recognition',
                        ],
                        faker.number.int({min: 3, max: 5})
                    ),
                });

                await userRepo.save(contentCreator);
                contentCreators.push(contentCreator);
                users.push(contentCreator); // Add to the general users array too
                logger.log(`Created content creator: ${contentCreator.username}`);
            }
        } catch (error: any) {
            logger.error(`Error creating content creators: ${error.message}`);
            logger.error(error.stack);
            throw error;
        }

        // Regular users - Reduced to 394 regular users
        const numberOfRegularUsers = 394;
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
                    coverImageUrl: faker.helpers.arrayElement(imageLinks),
                    address: faker.location.streetAddress({useFullAddress: true}),
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

        logger.log('Creating social links for admin...');

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
            const admin2User = users[1];

            // First, make all content creators friends with both admins
            logger.log('Creating friendships between admins and content creators...');

            for (const creator of contentCreators) {
                // Create friendship with first admin
                const firstAdminFriendship = friendRepo.create({
                    user_id: adminUser.id,
                    friend_id: creator.id,
                });
                await friendRepo.save(firstAdminFriendship);
                logger.log(`Created friendship between admin and ${creator.username}`);

                // Create friendship with second admin
                const secondAdminFriendship = friendRepo.create({
                    user_id: admin2User.id,
                    friend_id: creator.id,
                });
                await friendRepo.save(secondAdminFriendship);
                logger.log(`Created friendship between admin2 and ${creator.username}`);
            }

            // Regular users excluding admins and content creators
            const regularUsers = users.filter(
                (user) =>
                    user.id !== adminUser.id &&
                    user.id !== admin2User.id &&
                    !contentCreators.some((creator) => creator.id === user.id)
            );

            // Make admin users have a few more regular friends (beyond the content creators)
            const adminRegularFriendCount = faker.number.int({min: 2, max: 6});
            const admin2RegularFriendCount = faker.number.int({min: 2, max: 6});

            // Select regular friends for first admin
            const adminRegularFriends = faker.helpers.arrayElements(regularUsers, adminRegularFriendCount);

            logger.log(`Creating ${adminRegularFriendCount} additional regular friendships for first admin user`);
            for (const friend of adminRegularFriends) {
                const friendship = friendRepo.create({
                    user_id: adminUser.id,
                    friend_id: friend.id,
                });
                await friendRepo.save(friendship);
                logger.log(`Created friendship between admin and ${friend.username}`);
            }

            // Select friends for second admin (excluding those already friends with first admin)
            const potentialAdmin2RegularFriends = regularUsers.filter(
                (user) => !adminRegularFriends.some((friend) => friend.id === user.id)
            );

            const admin2RegularFriends = faker.helpers.arrayElements(
                potentialAdmin2RegularFriends,
                Math.min(admin2RegularFriendCount, potentialAdmin2RegularFriends.length)
            );

            logger.log(`Creating ${admin2RegularFriends.length} additional regular friendships for second admin user`);
            for (const friend of admin2RegularFriends) {
                const friendship = friendRepo.create({
                    user_id: admin2User.id,
                    friend_id: friend.id,
                });
                await friendRepo.save(friendship);
                logger.log(`Created friendship between admin2 and ${friend.username}`);
            }

            // Create significantly fewer friendships between regular users
            // Each user will have 0-2 friends (very few)
            logger.log('Creating very limited friendships between regular users...');

            // Process only about 20% of regular users to create even fewer connections
            const usersToProcess = faker.helpers.arrayElements(regularUsers, Math.floor(regularUsers.length * 0.2));

            for (const user of usersToProcess) {
                // Determine number of friends for this user (0-2)
                const numFriends = faker.number.int({min: 0, max: 2});

                if (numFriends === 0) continue; // Skip users who get 0 friends

                // Get potential friends (users that aren't the current user and exclude those already friends with admins)
                const allAdminFriends = [...contentCreators, ...adminRegularFriends, ...admin2RegularFriends];
                const potentialFriends = regularUsers.filter(
                    (u) => u.id !== user.id && !allAdminFriends.some((af) => af.id === u.id)
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
            // - Fewer requests to/from admin
            // - Very limited requests between other users

            // Create 5-8 friend requests specifically for admin (reduced number)
            const adminRequestCount = faker.number.int({min: 5, max: 8});
            logger.log(`Creating ${adminRequestCount} friend requests involving first admin`);

            // Get users who aren't already friends with admin
            const nonAdminFriends = regularUsers.filter(
                (user) => !adminRegularFriends.some((friend) => friend.id === user.id)
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

        // Create follower/following relationships
        logger.log('Creating follower/following relationships...');
        try {
            // Create followers for each user (20-30 followers per user)
            for (const user of users) {
                // Determine number of followers (20-30)
                const numFollowers = faker.number.int({min: 20, max: 30});
                logger.log(`Creating ${numFollowers} followers for user ${user.username}...`);

                // Get potential followers (excluding the user themselves)
                const potentialFollowers = users.filter((u) => u.id !== user.id);

                // Select random followers
                const selectedFollowers = faker.helpers.arrayElements(
                    potentialFollowers,
                    Math.min(numFollowers, potentialFollowers.length)
                );

                // Create follow relationships
                for (const follower of selectedFollowers) {
                    const userFollow = userFollowRepo.create({
                        follower_id: follower.id, // follower
                        following_id: user.id, // being followed
                    });
                    await userFollowRepo.save(userFollow);
                }
                logger.log(`Created ${selectedFollowers.length} followers for user ${user.username}`);

                // Determine number of users to follow (10-12)
                const numFollowing = faker.number.int({min: 10, max: 12});
                logger.log(`Creating ${numFollowing} following relationships for user ${user.username}...`);

                // Get potential users to follow (excluding the user themselves and those already following them)
                const potentialToFollow = users.filter(
                    (u) => u.id !== user.id && !selectedFollowers.some((f) => f.id === u.id)
                );

                // Select random users to follow
                const selectedToFollow = faker.helpers.arrayElements(
                    potentialToFollow,
                    Math.min(numFollowing, potentialToFollow.length)
                );

                // Create follow relationships
                for (const toFollow of selectedToFollow) {
                    const userFollow = userFollowRepo.create({
                        follower_id: user.id, // follower
                        following_id: toFollow.id, // being followed
                    });
                    await userFollowRepo.save(userFollow);
                }
                logger.log(`Created ${selectedToFollow.length} following relationships for user ${user.username}`);
            }

            logger.log('Follower/following relationships created successfully');
        } catch (error: any) {
            logger.error(`Error creating follower/following relationships: ${error.message}`);
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

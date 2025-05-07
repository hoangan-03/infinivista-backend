import {faker} from '@faker-js/faker';
import {Logger} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {DataSource} from 'typeorm';

import {CallHistory} from '@/entities/internal/call-history.entity';
import {CallStatus} from '@/modules/calling/enums/call-status.enum';
import {CallType} from '@/modules/calling/enums/call-type.enum';
import {AttachmentType} from '@/modules/messaging/enums/attachment-type.enum';
import {EmoteIcon} from '@/modules/messaging/enums/emote-icon.enum';

import {AppModule} from '../app.module';
import {UserReference} from '../entities/external/user-reference.entity';
import {GroupChat} from '../entities/internal/group-chat.entity';
import {GroupChatAttachment} from '../entities/internal/group-chat-attachment.entity';
import {GroupChatMessage} from '../entities/internal/group-chat-message.entity';
import {Message} from '../entities/internal/message.entity';
import {MessageAttachment} from '../entities/internal/message-attachment.entity';
import {MessageStatus} from '../modules/messaging/enums/message-status.enum';

const videoLinks = [
    'https://res.cloudinary.com/dght74v9o/video/upload/v1735408641/samples/cld-sample-video.mp4',
    'https://res.cloudinary.com/demo/video/upload/dog.mp4',
    'https://res.cloudinary.com/demo/video/upload/elephants.mp4',
    'https://res.cloudinary.com/dcb72w5e4/video/upload/v1742292056/samples/sea-turtle.mp4',
    'https://res.cloudinary.com/dcb72w5e4/video/upload/v1742292058/samples/dance-2.mp4',
    'https://videos.pexels.com/video-files/31646575/13482899_2560_1440_60fps.mp4',
    'https://videos.pexels.com/video-files/27729226/12212883_1440_2560_30fps.mp4',
    'https://videos.pexels.com/video-files/12052148/12052148-uhd_1440_2560_30fps.mp4',
    'https://videos.pexels.com/video-files/30281926/12981407_2560_1440_25fps.mp4',
    'https://videos.pexels.com/video-files/31532164/13439846_1920_1080_25fps.mp4',
    'https://videos.pexels.com/video-files/31828537/13559922_2560_1440_24fps.mp4',
    'https://videos.pexels.com/video-files/27692822/12206536_1920_1080_30fps.mp4',
    'https://videos.pexels.com/video-files/31598701/13464386_1080_1920_25fps.mp4',
    'https://videos.pexels.com/video-files/29792714/12800431_1920_1080_60fps.mp4',
    'https://videos.pexels.com/video-files/3850436/3850436-hd_1920_1080_24fps.mp4',
    'https://videos.pexels.com/video-files/30772101/13163067_2560_1440_60fps.mp4',
    'https://videos.pexels.com/video-files/31775344/13536308_1440_2560_50fps.mp4',
    'https://videos.pexels.com/video-files/28034501/12288471_2560_1440_30fps.mp4',
    'https://videos.pexels.com/video-files/3945877/3945877-uhd_2560_1440_30fps.mp4',
    'https://videos.pexels.com/video-files/30784261/13167552_1440_2560_30fps.mp4',
];

interface UserData {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
    phoneNumber: string;
}

export const seedCommunicationDatabase = async (dataSource: DataSource) => {
    const app = await NestFactory.createApplicationContext(AppModule);
    const logger = new Logger('CommunicationSeeder');

    try {
        logger.log('Starting communication module seeding...');

        // Get repositories
        const userReferenceRepo = dataSource.getRepository(UserReference);
        const messageRepo = dataSource.getRepository(Message);
        const groupChatRepo = dataSource.getRepository(GroupChat);
        const messageAttachmentRepo = dataSource.getRepository(MessageAttachment);
        const groupChatMessageRepo = dataSource.getRepository(GroupChatMessage);
        const groupChatAttachmentRepo = dataSource.getRepository(GroupChatAttachment);
        const CallHistoryRepo = dataSource.getRepository(CallHistory);

        // Clear existing data (in proper order to respect foreign keys)
        logger.log('Clearing existing data...');
        await CallHistoryRepo.query('TRUNCATE TABLE "call_history" CASCADE;');
        await messageAttachmentRepo.query('TRUNCATE TABLE "message_attachment" CASCADE;');
        await groupChatAttachmentRepo.query('TRUNCATE TABLE "group_chat_attachment" CASCADE;');
        await groupChatMessageRepo.query('TRUNCATE TABLE "group_chat_message" CASCADE;');
        await messageRepo.query('TRUNCATE TABLE "message" CASCADE;');
        await userReferenceRepo.query('TRUNCATE TABLE "user_reference" CASCADE;');
        await groupChatRepo.query('TRUNCATE TABLE "group_chat" CASCADE;');

        // Connect to the user module database to get real user data
        logger.log('Connecting to user module database...');

        // Create a separate connection to the user module database
        const userModuleConnection = new DataSource({
            type: 'postgres',
            host: 'localhost',
            port: 5435,
            username: 'postgres',
            password: 'postgres',
            database: 'infinivista-user',
        });

        await userModuleConnection.initialize();
        logger.log('Connected to user module database successfully');

        // Get all users from the user module database
        const users: UserData[] = await userModuleConnection.query(`
             SELECT u.id, u.email, u.username, u."firstName", u."lastName", u."profileImageUrl", u."phoneNumber"
             FROM users u
             ORDER BY u.id
         `);

        logger.log(`Retrieved ${users.length} users from user module database`);

        // Create user references with exact IDs and data from user module
        logger.log('Creating user references with actual user data...');
        const userRefs: UserReference[] = [];
        let adminUserRef: UserReference | undefined;
        let admin2UserRef: UserReference | undefined;
        const otherUserRefs: UserReference[] = [];

        for (const userData of users) {
            const userRef = userReferenceRepo.create({
                id: userData.id,
                email: userData.email,
                username: userData.username,
                firstName: userData.firstName,
                lastName: userData.lastName,
                profileImageUrl: userData.profileImageUrl,
                phoneNumber: userData.phoneNumber,
            });
            await userReferenceRepo.save(userRef);
            userRefs.push(userRef);

            if (userData.username === 'admin') {
                adminUserRef = userRef; // Store the admin user reference for later use
                logger.log(`Found admin user: ${userData.username} with ID ${userData.id}`);
            } else if (userData.username === 'admin2') {
                admin2UserRef = userRef; // Store the second admin user reference
                logger.log(`Found second admin user: ${userData.username} with ID ${userData.id}`);
            } else {
                otherUserRefs.push(userRef); // Store non-admin users separately
            }

            logger.log(`Created user reference for ${userData.username} with ID ${userData.id}`);
        }

        if (!adminUserRef) {
            logger.warn('Admin user not found. Using first user as admin for seeding purposes.');
            adminUserRef = userRefs[0];
        }

        // Close the user module connection
        await userModuleConnection.destroy();
        logger.log('Closed connection to user module database');

        // Create messages between the two admin users
        if (adminUserRef && admin2UserRef) {
            logger.log('Creating direct messages between admin users...');
            // Create 35-50 messages between admin users
            const messageCount = faker.number.int({min: 35, max: 50});

            for (let i = 0; i < messageCount; i++) {
                // Roughly equal number of messages from each admin
                const isAdmin1Sender = faker.datatype.boolean();
                const sender = isAdmin1Sender ? adminUserRef : admin2UserRef;
                const receiver = isAdmin1Sender ? admin2UserRef : adminUserRef;

                const message = messageRepo.create({
                    messageText: faker.lorem.sentence(),
                    sent_at: faker.date.recent({days: 21}),
                    status: faker.helpers.arrayElement(Object.values(MessageStatus)),
                    sender,
                    receiver,
                    emotion: faker.helpers.maybe(() => faker.helpers.arrayElement(Object.values(EmoteIcon)), {
                        probability: 0.4,
                    }),
                });
                await messageRepo.save(message);

                // Admin messages often contain attachments (50% probability)
                if (faker.datatype.boolean()) {
                    const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                    const attachment = messageAttachmentRepo.create({
                        attachment_url:
                            attachmentType === AttachmentType.VIDEO
                                ? faker.helpers.arrayElement(videoLinks)
                                : faker.image.url(),
                        attachment_name: `admin-doc-${i}.${faker.helpers.arrayElement(['jpg', 'pdf', 'xlsx', 'docx', 'png'])}`,
                        attachmentType,
                        sent_at: message.sent_at,
                        status: faker.helpers.arrayElement(Object.values(MessageStatus)),
                        sender,
                        receiver,
                    });
                    await messageAttachmentRepo.save(attachment);
                }
            }
            logger.log(`Created ${messageCount} messages between admin users`);
        }

        // Create direct messages between admins and other users (REDUCED VOLUME)
        logger.log('Creating direct messages primarily for admin users...');

        // Create messages between first admin and each other user
        for (const otherUser of otherUserRefs) {
            // Reduce to 10-15 messages between admin and each user (previously 20-30)
            const messageCount = faker.number.int({min: 10, max: 15});

            for (let i = 0; i < messageCount; i++) {
                // Admin sends 70% of messages, other user sends 30%
                const isAdminSender = faker.datatype.boolean({probability: 0.7});
                const sender = isAdminSender ? adminUserRef : otherUser;
                const receiver = isAdminSender ? otherUser : adminUserRef;

                const message = messageRepo.create({
                    messageText: faker.lorem.sentence(),
                    sent_at: faker.date.recent({days: 14}),
                    status: faker.helpers.arrayElement(Object.values(MessageStatus)),
                    sender,
                    receiver,
                    emotion: faker.helpers.maybe(() => faker.helpers.arrayElement(Object.values(EmoteIcon)), {
                        probability: 0.3,
                    }),
                });
                await messageRepo.save(message);

                // Occasionally add an attachment (40% for admin-sent messages, 20% for user-sent)
                const attachmentProbability = isAdminSender ? 0.4 : 0.2;
                if (faker.datatype.boolean({probability: attachmentProbability})) {
                    const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                    const attachment = messageAttachmentRepo.create({
                        attachment_url:
                            attachmentType === AttachmentType.VIDEO
                                ? faker.helpers.arrayElement(videoLinks)
                                : faker.image.url(),
                        attachment_name: `file${i}_${faker.lorem.word()}.${faker.helpers.arrayElement(['jpg', 'pdf', 'doc', 'png'])}`,
                        attachmentType,
                        sent_at: message.sent_at,
                        status: faker.helpers.arrayElement(Object.values(MessageStatus)),
                        sender,
                        receiver,
                    });
                    await messageAttachmentRepo.save(attachment);
                }
            }
        }

        // Create messages between second admin and each other user
        if (admin2UserRef) {
            for (const otherUser of otherUserRefs) {
                // Reduce to 8-12 messages between admin2 and each user (previously 15-25)
                const messageCount = faker.number.int({min: 8, max: 12});

                for (let i = 0; i < messageCount; i++) {
                    // Admin2 sends 65% of messages, other user sends 35%
                    const isAdminSender = faker.datatype.boolean({probability: 0.65});
                    const sender = isAdminSender ? admin2UserRef : otherUser;
                    const receiver = isAdminSender ? otherUser : admin2UserRef;

                    const message = messageRepo.create({
                        messageText: faker.lorem.sentence(),
                        sent_at: faker.date.recent({days: 10}),
                        status: faker.helpers.arrayElement(Object.values(MessageStatus)),
                        sender,
                        receiver,
                        emotion: faker.helpers.maybe(() => faker.helpers.arrayElement(Object.values(EmoteIcon)), {
                            probability: 0.3,
                        }),
                    });
                    await messageRepo.save(message);

                    // Occasionally add an attachment (35% for admin2-sent messages, 20% for user-sent)
                    const attachmentProbability = isAdminSender ? 0.35 : 0.2;
                    if (faker.datatype.boolean({probability: attachmentProbability})) {
                        const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));
                        const attachment = messageAttachmentRepo.create({
                            attachment_url:
                                attachmentType === AttachmentType.VIDEO
                                    ? faker.helpers.arrayElement(videoLinks)
                                    : faker.image.url(),
                            attachment_name: `file${i}_${faker.lorem.word()}.${faker.helpers.arrayElement(['jpg', 'pdf', 'doc', 'png'])}`,
                            attachmentType,
                            sent_at: message.sent_at,
                            status: faker.helpers.arrayElement(Object.values(MessageStatus)),
                            sender,
                            receiver,
                        });
                        await messageAttachmentRepo.save(attachment);
                    }
                }
            }
        }

        // Create minimal direct messages between non-admin users
        logger.log('Creating minimal direct messages between non-admin users...');
        // Get just 3 random pairs of users for conversations (previously 5)
        const userPairs: [UserReference, UserReference][] = [];
        for (let i = 0; i < Math.min(3, otherUserRefs.length); i++) {
            const user1Index = faker.number.int({min: 0, max: otherUserRefs.length - 1});
            let user2Index;
            do {
                user2Index = faker.number.int({min: 0, max: otherUserRefs.length - 1});
            } while (user2Index === user1Index);

            userPairs.push([otherUserRefs[user1Index], otherUserRefs[user2Index]]);
        }

        // Create 2-5 messages for each pair (previously 3-8)
        for (const [user1, user2] of userPairs) {
            const messageCount = faker.number.int({min: 2, max: 5});

            for (let i = 0; i < messageCount; i++) {
                const sender = i % 2 === 0 ? user1 : user2;
                const receiver = i % 2 === 0 ? user2 : user1;

                const message = messageRepo.create({
                    messageText: faker.lorem.sentence(),
                    sent_at: faker.date.recent({days: 5}),
                    status: faker.helpers.arrayElement(Object.values(MessageStatus)),
                    emotion: faker.helpers.maybe(() => faker.helpers.arrayElement(Object.values(EmoteIcon)), {
                        probability: 0.2,
                    }),
                    sender,
                    receiver,
                });
                await messageRepo.save(message);
            }
        }

        // Create group chats with admin always included
        logger.log('Creating group chats with admin as a prominent member...');

        // Create 3 different group chats
        const groupChatNames = ['Project Team', 'Marketing Strategy', 'Tech Support'];

        for (let chatIndex = 0; chatIndex < groupChatNames.length; chatIndex++) {
            const groupChat = groupChatRepo.create({
                group_name: groupChatNames[chatIndex],
            });
            await groupChatRepo.save(groupChat);

            // Clear and prepare join table as in original code
            try {
                await dataSource.query('TRUNCATE TABLE "group_chat_users" CASCADE;');
            } catch (error: any) {
                logger.warn(
                    `Could not clear join table: ${error.message}. This may be normal if it doesn't exist yet.`
                );
            }

            // Always add admin to each group
            try {
                await dataSource.query(
                    'INSERT INTO "group_chat_users" ("groupChatGroupChatId", "userReferenceId") VALUES ($1, $2)',
                    [groupChat.group_chat_id, adminUserRef.id]
                );
                logger.log(`Added admin to group chat ${groupChat.group_name}`);

                // Add 3-8 random other users to the group
                const memberCount = faker.number.int({min: 3, max: Math.min(8, otherUserRefs.length)});
                const shuffledUsers = faker.helpers.shuffle([...otherUserRefs]);

                for (let i = 0; i < memberCount; i++) {
                    const user = shuffledUsers[i];
                    await dataSource.query(
                        'INSERT INTO "group_chat_users" ("groupChatGroupChatId", "userReferenceId") VALUES ($1, $2)',
                        [groupChat.group_chat_id, user.id]
                    );
                }
            } catch (error: any) {
                // Same error handling as original code
                logger.error(`Failed to add user to group: ${error.message}`);
                if (error.message.includes('does not exist')) {
                    // Create table and retry as in original code
                    logger.log('Attempting to create the join table and retry...');

                    await dataSource.query(`
                        CREATE TABLE IF NOT EXISTS "group_chat_users" (
                            "groupChatGroupChatId" uuid NOT NULL,
                            "userReferenceId" uuid NOT NULL,
                            CONSTRAINT "PK_group_chat_users" PRIMARY KEY ("groupChatGroupChatId", "userReferenceId")
                        )
                    `);

                    // Retry insertion for admin
                    await dataSource.query(
                        'INSERT INTO "group_chat_users" ("groupChatGroupChatId", "userReferenceId") VALUES ($1, $2)',
                        [groupChat.group_chat_id, adminUserRef.id]
                    );
                }
            }

            // Create group messages - admin sends 60% of messages
            const messageCount = faker.number.int({min: 30, max: 60});
            for (let i = 0; i < messageCount; i++) {
                const isAdminMessage = faker.datatype.boolean({probability: 0.6});
                const sender = isAdminMessage ? adminUserRef : faker.helpers.arrayElement(otherUserRefs);

                const groupMessage = groupChatMessageRepo.create({
                    textMessage: faker.lorem.sentence(),
                    sent_at: faker.date.recent({days: 10}),
                    last_modified_at: new Date(),
                    status: faker.helpers.arrayElement(Object.values(MessageStatus)),
                    emotion: faker.helpers.maybe(
                        () => faker.helpers.arrayElements(Object.values(EmoteIcon), {min: 1, max: 3}),
                        {probability: 0.4}
                    ),
                    sender,
                    groupChat,
                });
                await groupChatMessageRepo.save(groupMessage);
            }

            // Add 1-3 attachments per group, mostly from admin
            const attachmentCount = faker.number.int({min: 1, max: 3});
            for (let i = 0; i < attachmentCount; i++) {
                const isAdminAttachment = faker.datatype.boolean({probability: 0.7});
                const sender = isAdminAttachment ? adminUserRef : faker.helpers.arrayElement(otherUserRefs);
                const attachmentType = faker.helpers.arrayElement(Object.values(AttachmentType));

                const attachment = groupChatAttachmentRepo.create({
                    attachment_url:
                        attachmentType === AttachmentType.VIDEO
                            ? faker.helpers.arrayElement(videoLinks)
                            : faker.image.url(),
                    attachment_name: `group-${chatIndex}-doc${i}.${faker.helpers.arrayElement(['pdf', 'xlsx', 'docx', 'png'])}`,
                    attachmentType,
                    sent_at: faker.date.recent({days: 7}),
                    status: faker.helpers.arrayElement(Object.values(MessageStatus)),
                    sender,
                    groupChat,
                });
                await groupChatAttachmentRepo.save(attachment);
            }
        }

        // Create call history records with focus on admins
        logger.log('Creating call history records focused on admin users...');
        const callStatusOptions = Object.values(CallStatus);
        const callTypeOptions = Object.values(CallType);

        // Create calls between the two admin users
        if (adminUserRef && admin2UserRef) {
            logger.log('Creating call history between admin users...');
            // Create 15-25 calls between the two admin users
            const callCount = faker.number.int({min: 15, max: 25});

            for (let i = 0; i < callCount; i++) {
                const isAdmin1Caller = faker.datatype.boolean();
                const caller = isAdmin1Caller ? adminUserRef : admin2UserRef;
                const receiver = isAdmin1Caller ? admin2UserRef : adminUserRef;

                // Generate call details
                const startTime = faker.date.recent({days: 30}); // Within last month
                const callStatus = faker.helpers.arrayElement(callStatusOptions);
                let endTime: Date | undefined = undefined;
                let acceptedAt: Date | undefined = undefined;

                // Admins usually have longer successful calls
                if (callStatus === CallStatus.ENDED) {
                    acceptedAt = new Date(startTime.getTime() + faker.number.int({min: 1000, max: 3000}));
                    endTime = new Date(acceptedAt!.getTime() + faker.number.int({min: 300000, max: 3600000})); // 5-60 min call
                } else if (callStatus === CallStatus.REJECTED) {
                    endTime = new Date(startTime.getTime() + faker.number.int({min: 3000, max: 10000}));
                } else if (callStatus === CallStatus.MISSED) {
                    endTime = new Date(startTime.getTime() + faker.number.int({min: 15000, max: 30000}));
                }

                const callHistory = CallHistoryRepo.create({
                    start_time: startTime,
                    end_time: endTime,
                    accepted_at: acceptedAt,
                    status: callStatus,
                    type: faker.helpers.arrayElement(callTypeOptions),
                    caller,
                    receiver,
                });

                await CallHistoryRepo.save(callHistory);
            }
            logger.log(`Created ${callCount} calls between admin users`);
        }

        // Create calls where first admin is involved (REDUCED)
        // Reduce to 30 calls (previously 50)
        const admin1CallCount = 30;
        for (let i = 0; i < admin1CallCount; i++) {
            const isAdminCaller = faker.datatype.boolean();
            const otherUser = faker.helpers.arrayElement(otherUserRefs);

            const caller = isAdminCaller ? adminUserRef : otherUser;
            const receiver = isAdminCaller ? otherUser : adminUserRef;

            // Generate call details
            const startTime = faker.date.recent({days: 21}); // Within last 3 weeks
            const callStatus = faker.helpers.arrayElement(callStatusOptions);
            let endTime: Date | undefined = undefined;
            let acceptedAt: Date | undefined = undefined;

            if (callStatus === CallStatus.ENDED) {
                acceptedAt = new Date(startTime.getTime() + faker.number.int({min: 1000, max: 5000}));
                endTime = new Date(acceptedAt!.getTime() + faker.number.int({min: 30000, max: 1800000})); // 30s - 30 min call
            } else if (callStatus === CallStatus.REJECTED) {
                endTime = new Date(startTime.getTime() + faker.number.int({min: 3000, max: 10000}));
            } else if (callStatus === CallStatus.MISSED) {
                endTime = new Date(startTime.getTime() + faker.number.int({min: 15000, max: 30000}));
            }

            const callHistory = CallHistoryRepo.create({
                start_time: startTime,
                end_time: endTime,
                accepted_at: acceptedAt,
                status: callStatus,
                type: faker.helpers.arrayElement(callTypeOptions),
                caller,
                receiver,
            });

            await CallHistoryRepo.save(callHistory);
        }

        // Create calls where second admin is involved (REDUCED)
        if (admin2UserRef) {
            // Reduce to 20 calls (previously 30)
            const admin2CallCount = 20;
            for (let i = 0; i < admin2CallCount; i++) {
                const isAdminCaller = faker.datatype.boolean();
                const otherUser = faker.helpers.arrayElement(otherUserRefs);

                const caller = isAdminCaller ? admin2UserRef : otherUser;
                const receiver = isAdminCaller ? otherUser : admin2UserRef;

                // Generate call details
                const startTime = faker.date.recent({days: 14}); // Within last 2 weeks
                const callStatus = faker.helpers.arrayElement(callStatusOptions);
                let endTime: Date | undefined = undefined;
                let acceptedAt: Date | undefined = undefined;

                if (callStatus === CallStatus.ENDED) {
                    acceptedAt = new Date(startTime.getTime() + faker.number.int({min: 1000, max: 5000}));
                    endTime = new Date(acceptedAt!.getTime() + faker.number.int({min: 30000, max: 1200000})); // 30s - 20 min call
                } else if (callStatus === CallStatus.REJECTED) {
                    endTime = new Date(startTime.getTime() + faker.number.int({min: 3000, max: 10000}));
                } else if (callStatus === CallStatus.MISSED) {
                    endTime = new Date(startTime.getTime() + faker.number.int({min: 15000, max: 30000}));
                }

                const callHistory = CallHistoryRepo.create({
                    start_time: startTime,
                    end_time: endTime,
                    accepted_at: acceptedAt,
                    status: callStatus,
                    type: faker.helpers.arrayElement(callTypeOptions),
                    caller,
                    receiver,
                });

                await CallHistoryRepo.save(callHistory);
            }
        }

        // Create just 8 calls between non-admin users (previously 15)
        const regularUserCallCount = 8;
        for (let i = 0; i < regularUserCallCount; i++) {
            const userIndices = faker.helpers.shuffle([...Array(otherUserRefs.length).keys()]);
            const caller = otherUserRefs[userIndices[0]];
            const receiver = otherUserRefs[userIndices[1]];

            // Generate call details
            const startTime = faker.date.recent({days: 14});
            const callStatus = faker.helpers.arrayElement(callStatusOptions);
            let endTime: Date | undefined = undefined;
            let acceptedAt: Date | undefined = undefined;

            if (callStatus === CallStatus.ENDED) {
                acceptedAt = new Date(startTime.getTime() + faker.number.int({min: 1000, max: 5000}));
                endTime = new Date(acceptedAt.getTime() + faker.number.int({min: 10000, max: 600000})); // 10s - 10 min call
            } else if (callStatus === CallStatus.REJECTED) {
                endTime = new Date(startTime.getTime() + faker.number.int({min: 3000, max: 10000}));
            } else if (callStatus === CallStatus.MISSED) {
                endTime = new Date(startTime.getTime() + faker.number.int({min: 15000, max: 30000}));
            }

            const callHistory = CallHistoryRepo.create({
                start_time: startTime,
                end_time: endTime,
                accepted_at: acceptedAt,
                status: callStatus,
                type: faker.helpers.arrayElement(callTypeOptions),
                caller,
                receiver,
            });

            await CallHistoryRepo.save(callHistory);
        }

        // Update the log message to reflect the new call counts
        const totalCallCount =
            admin1CallCount +
            (admin2UserRef ? 20 : 0) +
            regularUserCallCount +
            (adminUserRef && admin2UserRef ? faker.number.int({min: 15, max: 25}) : 0);
        logger.log(`Created approximately ${totalCallCount} call history records`);
        logger.log('Communication module seeding completed successfully!');
    } catch (error: any) {
        logger.error(`Error during seeding: ${error.message}`);
        logger.error(`Error details: ${JSON.stringify(error, null, 2)}`);
        if (error.stack) {
            logger.error(`Stack trace: ${error.stack}`);
        }
        logger.error('Communication module seeding failed!');
        process.exitCode = 1;
    } finally {
        await app.close();
    }
};
